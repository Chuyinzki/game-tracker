FROM golang:1.24-alpine AS build

WORKDIR /src

COPY go-service/ ./go-service/

WORKDIR /src/go-service

RUN go mod download
RUN go build -o /out/go-service .

FROM alpine:3.21

WORKDIR /app

COPY --from=build /out/go-service /usr/local/bin/go-service

EXPOSE 3004

CMD ["go-service"]
