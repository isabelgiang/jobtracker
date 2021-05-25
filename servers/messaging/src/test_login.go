package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
)

const (
	apiEndpoint   = "https://api.awesome-ness.me"
	loginEndpoint = "https://awesome-ness.me"
)

func login() (string, error) {
	data := url.Values{
		"email":    {"test@gmail.com"},
		"password": {"password"},
	}
	resp, err := http.PostForm(loginEndpoint, data)
	if err != nil {
		log.Fatal(err)
	}
	defer resp.Body.Close()

	var res map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&res)

	fmt.Printf("%+v\n", res)
	token := resp.Header.Get("Authorization")
	return token, nil
}

func testChannel() {
	data := url.Values{}
}

func testMessage() {

}

func main() {
	token, _ := login()
	fmt.Printf("token %s: ", token)
}
