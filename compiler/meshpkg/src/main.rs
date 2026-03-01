mod auth;
mod install;
mod publish;
mod search;

use std::path::PathBuf;
use std::process;

use clap::{Parser, Subcommand};
use colored::Colorize;

const DEFAULT_REGISTRY: &str = "https://api.packages.meshlang.dev";

#[derive(Parser)]
#[command(name = "meshpkg", version, about = "Mesh package manager")]
struct Cli {
    #[command(subcommand)]
    command: Commands,

    /// Output in JSON format (suppresses spinners and colored output)
    #[arg(long, global = true)]
    json: bool,
}

#[derive(Subcommand)]
enum Commands {
    /// Authenticate with the registry
    Login {
        /// Auth token (if not provided, prompted from stdin)
        #[arg(long)]
        token: Option<String>,
    },
    /// Publish this package to the registry
    Publish {
        /// Registry URL
        #[arg(long, default_value = DEFAULT_REGISTRY)]
        registry: String,
    },
    /// Install a package or all dependencies from mesh.toml
    Install {
        /// Package name to install (omit to install all from mesh.toml)
        name: Option<String>,
        /// Registry URL
        #[arg(long, default_value = DEFAULT_REGISTRY)]
        registry: String,
    },
    /// Search for packages in the registry
    Search {
        /// Search query
        query: String,
        /// Registry URL
        #[arg(long, default_value = DEFAULT_REGISTRY)]
        registry: String,
    },
}

fn main() {
    let cli = Cli::parse();
    let json_mode = cli.json;

    let result = match cli.command {
        Commands::Login { token } => run_login(token, json_mode),
        Commands::Publish { registry } => {
            publish::run(&PathBuf::from("."), &registry, json_mode)
        }
        Commands::Install { name, registry } => {
            install::run(&PathBuf::from("."), name.as_deref(), &registry, json_mode)
        }
        Commands::Search { query, registry } => {
            search::run(&query, &registry, json_mode)
        }
    };

    match result {
        Ok(()) => process::exit(0),
        Err(e) => {
            if json_mode {
                eprintln!("{{\"error\": \"{}\"}}", e.replace('"', "\\\""));
            } else {
                eprintln!("{} {}", "✗".red().bold(), e);
            }
            process::exit(1);
        }
    }
}

fn run_login(token: Option<String>, json_mode: bool) -> Result<(), String> {
    let token = match token {
        Some(t) => t,
        None => {
            // Read from stdin interactively
            eprint!("Enter registry token: ");
            let mut input = String::new();
            std::io::stdin().read_line(&mut input)
                .map_err(|e| format!("Failed to read token: {}", e))?;
            input.trim().to_string()
        }
    };

    if token.is_empty() {
        return Err("Token cannot be empty".to_string());
    }

    auth::write_token(&token)?;

    if json_mode {
        println!("{{\"status\": \"ok\", \"message\": \"Token saved\"}}");
    } else {
        println!("{} Token saved to {}", "✓".green().bold(), auth::credentials_path().display());
    }
    Ok(())
}
