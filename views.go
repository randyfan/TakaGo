package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path"
	"text/template"
)

func mainPageHandler(w http.ResponseWriter, r *http.Request) {
	//response.Header().Set("Content-type", "text/html")
	fp := path.Join("templates", "MainPage.html")
	tmpl, err := template.ParseFiles(fp)

	if err != nil {
		log.Println(err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if err := tmpl.Execute(w, nil); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

//https://stackoverflow.com/questions/15407719/in-gos-http-package-how-do-i-get-the-query-string-on-a-post-request/29237567
func fillerHandler(w http.ResponseWriter, r *http.Request) {
	currCumUtterances := r.URL.Query().Get("currCumUtterances") // Speech text is cumulative. Contains all the text said so far
	fillerCountDict := getFillerCountDict(currCumUtterances)

	data := map[string]map[string]int{
		"filler_result": fillerCountDict,
	}
	json.NewEncoder(w).Encode(data)

}

func frequentHandler(w http.ResponseWriter, r *http.Request) {
	curr_cum_utterances := r.URL.Query().Get("currCumUtterances")
	most_frequent_count_dict := getFrequentCountDict(curr_cum_utterances)
	// What's returned
	data := map[string]map[string]int{
		"frequent_result": most_frequent_count_dict,
	}
	json.NewEncoder(w).Encode(data)
}

func speedHandler(w http.ResponseWriter, r *http.Request) {
	curr_utterance := r.URL.Query().Get("currUtterance") // cur current sentence/monologue (no break in speech)
	time_elapsed := r.URL.Query().Get("timeElapsed")     // in seconds, includes decimal
	talking_speed, corresponding_color, corresponding_text := get_talking_speed(curr_utterance,
		time_elapsed) // Talking too fast or slow == red color, just right == green

	// https://stackoverflow.com/questions/18526046/mapping-strings-to-multiple-types-for-json-objects
	data := map[string]interface{}{
		"speed_result": talking_speed,
		"speed_color":  corresponding_color,
		"speed_text":   corresponding_text,
	}

	fmt.Print(data)
	json.NewEncoder(w).Encode(data)
}

//https://stackoverflow.com/questions/43601359/how-do-i-serve-css-and-js-in-go
func main() {
	http.HandleFunc("/", mainPageHandler)
	http.HandleFunc("/filler", fillerHandler)
	http.HandleFunc("/frequent", frequentHandler)
	http.HandleFunc("/speed", speedHandler)
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	fmt.Printf("Successfully connected and listening")

	//http.ListenAndServe(":6006", nil)

	//https://gist.github.com/robinmonjo/5892893
	port := os.Getenv("PORT")
	if len(port) == 0 {
		port = "9999"
	}
	fmt.Println("listening on port: ", port)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		panic(err)
	}
}

// https://levelup.gitconnected.com/deploying-a-simple-golang-webapp-on-heroku-4dbd00bc9b0e
// If cannot find that app:
// https://stackoverflow.com/questions/53551717/couldnt-find-that-app-when-running-heroku-commands-in-console
