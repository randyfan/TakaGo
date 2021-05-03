from google_trans_new import google_translator
from special_word_lists import *

def get_translate(cum_utterances):
    '''
    Translate into french (temporary solution)
    '''
    result_text = ""
    translator = google_translator() #https://stackoverflow.com/questions/65144681/attributeerror-nonetype-object-has-no-attribute-group-googletrans-python
    translations = translator.translate(cum_utterances, lang_src='en',lang_tgt='fr')  # https://stackoverflow.com/questions/65144681/attributeerror-nonetype-object-has-no-attribute-group-googletrans-python
    for translation in translations:
        result_text += translation
    return result_text

def get_filler_count_dict(curr_cum_utterances):
    '''
    Get the # of filler words uttered. Currently cannot detect "uhhs" and "ahhs"
    '''
    filler_words = taka_filler_words  # make sure all lower case
    filler_counter = {word: 0 for word in filler_words}
    words = curr_cum_utterances.split(" ")
    for i, word in enumerate(words):

        if i + 2 <= len(words):
            bigram = " ".join(words[i:i+2])
            if bigram.lower() in filler_counter:
                filler_counter[bigram] = filler_counter.get(bigram, 0) + 1
        if word.lower() in filler_counter:
            filler_counter[word] = filler_counter.get(word, 0) + 1

    print("filler counter", filler_counter, flush = True)
    return filler_counter

def get_frequent_count_dict(curr_cum_utterances):
    '''
       Get the most frequent uttered words.
       '''
    filler_words = taka_filler_words
    common_words = taka_common_words # list is quite long, so put in special_word_lists.py for cleaner code

    frequent_counter = {word: 0 for word in filler_words}
    words = curr_cum_utterances.split(" ")

    for i, word in enumerate(words):
        if i + 2 <= len(words):
            bigram = " ".join(words[i:i + 2])
            bigram = bigram.lower()
            if bigram not in filler_words and bigram not in common_words:
                frequent_counter[bigram] = frequent_counter.get(bigram, 0) + 1

        if word.lower() in filler_words and word.lower() not in common_words:
            frequent_counter[word] = frequent_counter.get(word, 0) + 1

    most_frequent_counter = dict(sorted(frequent_counter.items(), key=lambda x: x[1], reverse=True)[:5])
    print("top 5 frequent counter", most_frequent_counter, flush=True)
    return most_frequent_counter


def get_talking_speed(curr_utterance, time_elapsed):
    '''
    Get words/sec from current utterrance.  Currrent, not cumulative, because we don't want long pauses between utterances to affect results
    average speaker in a TED talk falls at right about 163 WPM
    Ideal range: 115-175 words/min => 1.91-2.91 words https://www.visualthesaurus.com/cm/wc/seven-ways-to-write-a-better-speech/#:~:text=The%20average%20person%20speaks%20at,Be%20careful!
    time_elapsed = seconds, with nanoscale precision
    https://improvepodcast.com/words-per-minute/
    https://speakerhubhq.medium.com/your-speech-pace-guide-to-speeding-and-slowing-down-be150dcb9cd7#:~:text=Speech%20rate%20guidelines%3A,Fast%3A%20more%20than%20160%20wpm
    https://successfully-speaking.com/blog/2016/6/27/do-you-speak-toofast-or-toooo-s-l-o-w-l-y#:~:text=What%20is%20a%20typical%20rate,at%20right%20about%20163%20WPM.
    '''

    # if there's been at least 3 seconds between this being invoked and previous time it processed
    time_elapsed = float(time_elapsed)
    words = curr_utterance.split(" ")

    # remove words like "a" that are too short and take up around half the time to say
    no_short_words = []
    almost_short_words = [] # length 3
    short_words = []
    for word in words:
        if len(word) >= 3:
            no_short_words.append(word)
        elif len(word) == 3:
            almost_short_words.append(word)
        else:
            short_words.append(word)

  #  if time_elapsed < 30:
      #  time_elapsed_adjusted = time_elapsed - 0.45 # HYPERPARAMETER
    #Since time ends when it finalizes, we need to subtract this difference
  #  else: # if utterance is very long
    # time_elapsed_adjusted = time_elapsed - 0.81     # TODO: Randy thinks the hyperparameter increases slightly depending on the length of the utterance.
    #need -0.81 for ~30 seconds

    print("MOOF " , no_short_words, flush = True)
   # print("Time elapsed" , time_elapsed_adjusted, flush = True)
   # words_per_sec = len(words)/time_elapsed_adjusted
    print("Time elapsed" , time_elapsed, flush = True)
    words_per_sec = (len(no_short_words) + .75*len(almost_short_words) + .5*len(short_words)) / time_elapsed  # words like "a" that are too short and take up around half the time to say
    print("Words/sec: ", words_per_sec, flush=True)


    color = "no color set. error in get_talking_speed()"
    speech_text = "no text set. error in get_talking_speed()"
    if words_per_sec > 2.91:
        color = "red"
        speech_text = "Too fast"
    elif words_per_sec <= 2.91 and words_per_sec >= 1.91:
        color = "green"
        speech_text = "Perfect pacing"
    else:
        color = "red"
        speech_text = "Too slow"

    return round(words_per_sec, 2), color, speech_text

