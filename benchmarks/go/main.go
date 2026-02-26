package main

import (
	"fmt"
	"net/http"
	"runtime"
)

func textHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain")
	fmt.Fprint(w, "Hello, World!\n")
}

func jsonHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprint(w, `{"message":"Hello, World!"}`)
}

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())
	mux := http.NewServeMux()
	mux.HandleFunc("/text", textHandler)
	mux.HandleFunc("/json", jsonHandler)
	http.ListenAndServe(":3001", mux)
}
