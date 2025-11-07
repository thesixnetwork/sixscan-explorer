echo "./gcloud_deploy.sh {env}"
DEPLOY_ENV=$1

function _exit_if_fail
{
  if [ "$1" != "0" ]; then
    exit 1
  fi
}

. ./.env-${DEPLOY_ENV}

echo "Google Cloud Bucket Name : ${GCLOUD_STORAGE_NAME}"
echo "Google Cloud LB Name : ${GCLOUD_LB_NAME}"

echo -e "Enter to continue...\c"
read

npm install --legacy-peer-deps
_exit_if_fail $?

NODE_OPTIONS="--openssl-legacy-provider" npm run build:${DEPLOY_ENV} --fix
_exit_if_fail $?

echo "Build ${GCLOUD_STORAGE_NAME} is SUCCESS"

gsutil -m cp -r dist/* ${GCLOUD_STORAGE_NAME}
_exit_if_fail $?

echo "Clear cache...."
gcloud compute url-maps invalidate-cdn-cache ${GCLOUD_LB_NAME} --path '/*' --async
_exit_if_fail $?

echo "Upload Done!"