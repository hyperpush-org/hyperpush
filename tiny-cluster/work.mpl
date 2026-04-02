# Function distribution
@cluster(3) pub fn add() -> Int do
  1 + 1
end

# Route distribution
let router = HTTP.router()
  |> HTTP.on_post("/api/call", HTTP.cluster(handle_event))