FROM openjdk:9-jre-slim

LABEL name "Lavalink"
LABEL version "2.0.0"
LABEL maintainer "iCrawl <icrawltogo@gmail.com>"

WORKDIR /usr/src/Lavalink

COPY Lavalink.jar application.yml ./

EXPOSE 2333 8000

CMD ["java", "-jar", "Lavalink.jar"]
