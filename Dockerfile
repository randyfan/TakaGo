FROM golang:1.16.3-alpine AS builder
RUN mkdir /build
ADD go.mod go.sum views.go analyze_speech_funcs.go special_word_lists.go /build/
WORKDIR /build
RUN go build


FROM alpine
RUN adduser -S -D -H -h /app appuser
USER appuser
COPY --from=builder /build/TakaGo /app/
COPY static/ /app/static
COPY templates/ /app/templates
WORKDIR /app
CMD ["./TakaGo"]