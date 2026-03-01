use aws_sdk_s3::config::{BehaviorVersion, Credentials, Region};
use aws_sdk_s3::primitives::ByteStream;
use crate::config::AppConfig;

#[derive(Clone)]
pub struct R2Client {
    pub client: aws_sdk_s3::Client,
    pub bucket: String,
}

pub fn build_r2_client(config: &AppConfig) -> R2Client {
    let creds = Credentials::new(
        &config.storage_access_key_id,
        &config.storage_secret_access_key,
        None, None, "mesh-registry",
    );
    let s3_config = aws_sdk_s3::Config::builder()
        .behavior_version(BehaviorVersion::latest())
        .endpoint_url(&config.storage_endpoint)
        .credentials_provider(creds)
        .region(Region::new(config.storage_region.clone()))
        .force_path_style(true)  // Required for MinIO; harmless for R2
        .build();
    R2Client {
        client: aws_sdk_s3::Client::from_conf(s3_config),
        bucket: config.storage_bucket.clone(),
    }
}

impl R2Client {
    /// Check if a blob with the given SHA-256 key exists in R2.
    pub async fn object_exists(&self, sha256: &str) -> Result<bool, String> {
        match self.client.head_object()
            .bucket(&self.bucket)
            .key(sha256)
            .send()
            .await
        {
            Ok(_) => Ok(true),
            Err(e) => {
                let service_err = e.into_service_error();
                if service_err.is_not_found() {
                    Ok(false)
                } else {
                    Err(format!("R2 head_object error: {:?}", service_err))
                }
            }
        }
    }

    /// Upload tarball bytes to R2 with SHA-256 as the key.
    pub async fn put_object(&self, sha256: &str, data: &[u8]) -> Result<(), String> {
        self.client.put_object()
            .bucket(&self.bucket)
            .key(sha256)
            .body(ByteStream::from(data.to_vec()))
            .send()
            .await
            .map_err(|e| format!("R2 put_object error: {}", e))?;
        Ok(())
    }

    /// Get an object from R2, returning its output for streaming.
    pub async fn get_object(&self, sha256: &str) -> Result<aws_sdk_s3::operation::get_object::GetObjectOutput, String> {
        self.client.get_object()
            .bucket(&self.bucket)
            .key(sha256)
            .send()
            .await
            .map_err(|e| format!("R2 get_object error: {}", e))
    }
}
