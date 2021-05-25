package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"golang.org/x/net/html"
)

//PreviewImage represents a preview image for a page
type PreviewImage struct {
	URL       string `json:"url,omitempty"`
	SecureURL string `json:"secureURL,omitempty"`
	Type      string `json:"type,omitempty"`
	Width     int    `json:"width,omitempty"`
	Height    int    `json:"height,omitempty"`
	Alt       string `json:"alt,omitempty"`
}

//PageSummary represents summary properties for a web page
type PageSummary struct {
	Type        string          `json:"type,omitempty"`
	URL         string          `json:"url,omitempty"`
	Title       string          `json:"title,omitempty"`
	SiteName    string          `json:"siteName,omitempty"`
	Description string          `json:"description,omitempty"`
	Author      string          `json:"author,omitempty"`
	Keywords    []string        `json:"keywords,omitempty"`
	Icon        *PreviewImage   `json:"icon,omitempty"`
	Images      []*PreviewImage `json:"images,omitempty"`
}

//SummaryHandler handles requests for the page summary API.
//This API expects one query string parameter named `url`,
//which should contain a URL to a web page. It responds with
//a JSON-encoded PageSummary struct containing the page summary
//meta-data.
func SummaryHandler(w http.ResponseWriter, r *http.Request) {
	inputURL := r.FormValue("url")
	if len(inputURL) == 0 {
		http.Error(w, "400: BadRequest - Please supply a URL", http.StatusBadRequest)
		return
	}
	HTMLStream, err := fetchHTML(inputURL)
	if err != nil {
		http.Error(w, fmt.Sprintf("400: BadRequest - %s", err), http.StatusBadRequest)
		return
	}
	metadata, err := extractSummary(inputURL, HTMLStream)
	if err != nil {
		http.Error(
			w,
			fmt.Sprintf("500: InternalServerError - there was an error extracting the page summary: %s", err),
			http.StatusInternalServerError,
		)
		return
	}
	defer HTMLStream.Close()
	response, err := json.Marshal(metadata)
	if err != nil {
		http.Error(
			w,
			fmt.Sprintf("500: InternalServerError - there was an error returning converting the page summary to JSON: %s", err),
			http.StatusInternalServerError,
		)
		return
	}

	w.Header().Add("Content-Type", "application/json")
	w.Write(response)
}

//fetchHTML fetches `pageURL` and returns the body stream or an error.
//Errors are returned if the response status code is an error (>=400),
//or if the content type indicates the URL is not an HTML page.
func fetchHTML(pageURL string) (io.ReadCloser, error) {
	resp, err := http.Get(pageURL)
	if err != nil {
		return nil, err
	}

	statusCode := resp.StatusCode
	contentType := resp.Header.Get("Content-Type")
	mediaType, _, _ := mime.ParseMediaType(contentType)
	if statusCode >= 400 {
		return nil, fmt.Errorf("response status code is %d", statusCode)
	}
	if mediaType != "text/html" {
		return nil, errors.New("content type is not HTML")
	}
	return resp.Body, nil
}

//extractSummary tokenizes the `htmlStream` and populates a PageSummary
//struct with the page's summary meta-data.
func extractSummary(pageURL string, htmlStream io.ReadCloser) (*PageSummary, error) {
	pageSummary := PageSummary{}

	// References
	// https://drstearns.github.io/tutorials/tokenizing/
	// https://gist.github.com/inotnako/c4a82f6723f6ccea5d83c5d3689373dd
	tokenizer := html.NewTokenizer(htmlStream)
	endTokenization := false
	for !endTokenization {
		tokenType := tokenizer.Next()
		switch tokenType {
		// Handle tokenization errors and EOF
		case html.ErrorToken:
			err := tokenizer.Err()
			if err == io.EOF {
				endTokenization = true
			} else {
				return nil, fmt.Errorf("error tokenizing HTML: %v", tokenizer.Err())
			}
		// Process tokens relevant to pageSummary
		case html.StartTagToken, html.SelfClosingTagToken:
			token := tokenizer.Token()
			switch token.Data {
			case "title":
				// Don't override og:title
				if len(pageSummary.Title) == 0 {
					tokenType = tokenizer.Next()
					if tokenType == html.TextToken {
						pageSummary.Title = tokenizer.Token().Data
					}
				}
			case "meta":
				processMetaTag(&token, &pageSummary, pageURL)
			case "link":
				processLinkTag(&token, &pageSummary, pageURL)
			}
		// Stop tokenizing at </head>
		case html.EndTagToken:
			token := tokenizer.Token()
			if token.Data == "head" {
				endTokenization = true
			}
		}
	}
	return &pageSummary, nil
}

//processMetaTag takes in a meta HTML tag token and assigns values
//to the pageSummary metadata as needed
//it also takes in a pageURL to convert relative image paths to absolute paths
func processMetaTag(meta *html.Token, pageSummary *PageSummary, pageURL string) {
	var attribute string
	var value string

	for _, attr := range meta.Attr {
		if attr.Key == "property" || attr.Key == "name" {
			attribute = attr.Val
		} else if attr.Key == "content" {
			value = attr.Val
		}
	}
	switch attribute {
	case "og:type":
		pageSummary.Type = value
	case "og:url":
		pageSummary.URL = value
	case "og:title":
		pageSummary.Title = value
	case "og:site_name":
		pageSummary.SiteName = value
	case "og:description":
		pageSummary.Description = value
	case "description":
		// Don't override og:description
		if len(pageSummary.Description) == 0 {
			pageSummary.Description = value
		}
	case "author":
		pageSummary.Author = value
	case "keywords":
		keywords := strings.Split(value, ",")
		for i, keyword := range keywords {
			keywords[i] = strings.TrimSpace(keyword)
		}
		pageSummary.Keywords = keywords
	// If we encounter a new "og:image" property, append a new image to Images
	case "og:image", "og:image:url":
		imageURL, _ := toAbsoluteURL(value, pageURL)
		image := &PreviewImage{URL: imageURL}
		pageSummary.Images = append(pageSummary.Images, image)
	// If we encounter og image structured properties, add property to latest image
	case "og:image:secure_url":
		image := pageSummary.Images[len(pageSummary.Images)-1]
		image.SecureURL = value
	case "og:image:type":
		image := pageSummary.Images[len(pageSummary.Images)-1]
		image.Type = value
	case "og:image:width":
		image := pageSummary.Images[len(pageSummary.Images)-1]
		if width, err := strconv.Atoi(value); err == nil {
			image.Width = width
		}
	case "og:image:height":
		image := pageSummary.Images[len(pageSummary.Images)-1]
		if height, err := strconv.Atoi(value); err == nil {
			image.Height = height
		}
	case "og:image:alt":
		image := pageSummary.Images[len(pageSummary.Images)-1]
		image.Alt = value
	}
}

//processLinkTag takes in a link HTML tag token and assigns an icon
//to the pageSummary.Icon field as needed
//it also takes in a pageURL to convert relative image paths to absolute paths
func processLinkTag(link *html.Token, pageSummary *PageSummary, pageURL string) {
	var linkRel string
	var linkURL string
	var linkSecureURL string
	var linkType string
	var linkHeight int
	var linkWidth int
	var linkAlt string
	for _, attr := range link.Attr {
		switch attr.Key {
		case "rel":
			linkRel = attr.Val
		case "href":
			linkURL, _ = toAbsoluteURL(attr.Val, pageURL)
		case "secure_url":
			linkSecureURL = attr.Val
		case "type":
			linkType = attr.Val
		case "sizes":
			sizes := []string{}
			if strings.Contains(attr.Val, "x") {
				sizes = strings.Split(attr.Val, "x")
			} else if strings.Contains(attr.Val, "X") {
				sizes = strings.Split(attr.Val, "X")
			}
			if len(sizes) > 0 {
				// Reference https://stackoverflow.com/a/29841190
				if height, err := strconv.Atoi(sizes[0]); err == nil {
					linkHeight = height
				}
				if width, err := strconv.Atoi(sizes[1]); err == nil {
					linkWidth = width
				}
			}
		case "alt":
			linkAlt = attr.Val
		}
	}
	if linkRel == "icon" {
		pageSummary.Icon = &PreviewImage{
			URL:       linkURL,
			SecureURL: linkSecureURL,
			Type:      linkType,
			Width:     linkWidth,
			Height:    linkHeight,
			Alt:       linkAlt,
		}
	}
}

//toAbsoluteURL takes a refURL string and a baseURL string
//and returns a string representation of the resolved absolute URL
func toAbsoluteURL(refURL string, baseURL string) (string, error) {
	base, baseErr := url.Parse(baseURL)
	if baseErr != nil {
		return "", fmt.Errorf("error while parsing the baseURL string: %s", baseErr)
	}
	if len(base.Scheme) == 0 {
		return "", fmt.Errorf("invalid baseURL string: \"%s\", baseURL is missing scheme", baseURL)
	}
	if len(base.Host) == 0 {
		return "", fmt.Errorf("invalid baseURL string: \"%s\", baseURL is missing host", baseURL)
	}

	ref, refErr := url.Parse(refURL)
	if refErr != nil {
		return "", fmt.Errorf("error while parsing the refURL string: %s", refErr)
	}
	if len(ref.String()) == 0 {
		return "", fmt.Errorf("invalid refURL: \"%s\", refURL is empty", refURL)
	}
	return base.ResolveReference(ref).String(), nil
}
