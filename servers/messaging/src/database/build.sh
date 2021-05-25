# cd to current script directory
scriptdir=$(dirname $0)
cd $scriptdir

docker build -t wills0ng/info441-messaging-mongodb .
docker system prune -f