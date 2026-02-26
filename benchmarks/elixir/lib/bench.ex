defmodule Bench.Router do
  use Plug.Router

  plug :match
  plug :dispatch

  get "/text" do
    conn
    |> put_resp_content_type("text/plain")
    |> send_resp(200, "Hello, World!\n")
  end

  get "/json" do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(200, ~s({"message":"Hello, World!"}))
  end

  match _ do
    send_resp(conn, 404, "Not found")
  end
end

defmodule Bench.Application do
  use Application

  @impl true
  def start(_type, _args) do
    children = [
      {Plug.Cowboy, scheme: :http, plug: Bench.Router, options: [port: 3003]}
    ]

    opts = [strategy: :one_for_one, name: Bench.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
