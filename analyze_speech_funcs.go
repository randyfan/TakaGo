package main

import (
	"math"
	"sort"
	"strconv"
	"strings"
)

// https://medium.com/@kdnotes/how-to-sort-golang-maps-by-value-and-key-eedc1199d944
type Pair struct {
	Key   string
	Value int
}

type PairList []Pair

func (p PairList) Len() int           { return len(p) }
func (p PairList) Swap(i, j int)      { p[i], p[j] = p[j], p[i] }
func (p PairList) Less(i, j int) bool { return p[i].Value > p[j].Value } // Decending Order, so should be More?

// Find takes a slice and looks for an element in it. It returns bool
func find(slice []string, val string) bool {
	for _, item := range slice {
		if item == val {
			return true
		}
	}
	return false
}

func getFillerCountDict(curr_cum_utterances string) map[string]int {
	/*
	   Get the # of filler words uttered. Currently cannot detect "uhhs" and "ahhs"
	*/
	filler_words := taka_filler_words // make sure all lower case
	filler_counter := map[string]int{}

	for _, word := range filler_words {
		filler_counter[word] = 0
	}

	words := strings.Split(curr_cum_utterances, " ") //curr_cum_utterances.split(" ")
	for i, word := range words {
		if i+2 <= len(words) {
			//bigram = " ".join(words[i : i+2])
			bigram := strings.Join(words[i:i+2], " ")
			if _, ok := filler_counter[strings.ToLower(bigram)]; ok {
				filler_counter[bigram] = filler_counter[bigram] + 1 //if bigram doesn't exist, it automatically returns 0 + 1
			}
		}
		if _, ok := filler_counter[strings.ToLower(word)]; ok {
			filler_counter[word] = filler_counter[word] + 1
		}
	}
	// print("filler counter", filler_counter, flush = True)
	return filler_counter
}

func getFrequentCountDict(curr_cum_utterances string) map[string]int {
	/*
	   Get the most frequent uttered words.
	*/
	filler_words := taka_filler_words
	common_words := taka_common_words // list is quite long, so put in special_word_lists.py for cleaner code

	frequent_counter := map[string]int{} //{word: 0 for word in filler_words}

	for _, word := range filler_words {
		frequent_counter[word] = 0
	}

	words := strings.Split(curr_cum_utterances, " ")

	for i, word := range words {
		if i+2 <= len(words) {
			bigram := strings.Join(words[i:i+2], " ") //" ".join(words[i : i+2])
			bigram = strings.ToLower(bigram)          //.lower()

			if !find(filler_words, bigram) && !find(common_words, bigram) {
				frequent_counter[bigram] = frequent_counter[bigram] + 1
			}
		}
		if find(filler_words, strings.ToLower(word)) && !find(common_words, strings.ToLower(word)) {
			frequent_counter[word] = frequent_counter[word] + 1
		}
	}

	p := make(PairList, len(frequent_counter))

	i := 0
	for k, v := range frequent_counter {
		p[i] = Pair{k, v}
		i++
	}
	sort.Sort(p)

	p = p[:5]
	most_frequent_counter := make(map[string]int)

	for _, tup := range p {
		most_frequent_counter[tup.Key] = tup.Value
	}

	// most_frequent_counter = dict(sorted(frequent_counter.items(), key=lambda x: x[1], reverse=True)[:5])
	//print("top 5 frequent counter", most_frequent_counter, flush=True)
	return most_frequent_counter
}

func get_talking_speed(curr_utterance string, time_elapsed string) (float64, string, string) {
	/*
	   Get words/sec from current utterrance.  Currrent, not cumulative, because we don't want long pauses between utterances to affect results
	   average speaker in a TED talk falls at right about 163 WPM
	   Ideal range: 115-175 words/min => 1.91-2.91 words https://www.visualthesaurus.com/cm/wc/seven-ways-to-write-a-better-speech/#:~:text=The%20average%20person%20speaks%20at,Be%20careful!
	   time_elapsed = seconds, with nanoscale precision
	   https://improvepodcast.com/words-per-minute/
	   https://speakerhubhq.medium.com/your-speech-pace-guide-to-speeding-and-slowing-down-be150dcb9cd7#:~:text=Speech%20rate%20guidelines%3A,Fast%3A%20more%20than%20160%20wpm
	   https://successfully-speaking.com/blog/2016/6/27/do-you-speak-toofast-or-toooo-s-l-o-w-l-y#:~:text=What%20is%20a%20typical%20rate,at%20right%20about%20163%20WPM.
	*/

	/* if there's been at least 3 seconds between this being invoked and previous time it processed*/
	float_time_elapsed, _ := strconv.ParseFloat(time_elapsed, 64)
	words := strings.Split(curr_utterance, " ")

	// remove words like "a" that are too short and take up around half the time to say
	var no_short_words []string
	var almost_short_words []string // length 3
	var short_words []string
	for _, word := range words {
		if len(word) >= 3 {
			no_short_words = append(no_short_words, word)
		} else if len(word) == 3 {
			almost_short_words = append(almost_short_words, word)
		} else {
			short_words = append(short_words, word) //short_words.append(word)
		}
	}

	words_per_sec := (float64(len(no_short_words)) + 0.75*float64(len(almost_short_words)) + 0.5*float64(len(short_words))) / float_time_elapsed // words like "a" that are too short and take up around half the time to say

	color := "no color set. error in get_talking_speed()"
	speech_text := "no text set. error in get_talking_speed()"
	if words_per_sec > 2.91 {
		color = "red"

		speech_text = "Too fast"
	} else if words_per_sec <= 2.91 && words_per_sec >= 1.91 {
		color = "green"
		speech_text = "Perfect pacing"
	} else {
		color = "red"
		speech_text = "Too slow"
	}

	precision := math.Round(words_per_sec*100) / 100 // 2 dec
	return precision, color, speech_text
}
