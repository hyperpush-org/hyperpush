defmodule Bench.MixProject do
  use Mix.Project

  def project do
    [
      app: :bench,
      version: "0.1.0",
      elixir: "~> 1.14",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    [
      extra_applications: [:logger],
      mod: {Bench.Application, []}
    ]
  end

  defp deps do
    [
      {:plug_cowboy, "~> 2.6"}
    ]
  end
end
