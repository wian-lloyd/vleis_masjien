require('dotenv').config();
const { private_key_id, private_key } = process.env;

const account = {
	private_key_id,
	private_key: private_key.replace(/\\n/g, '\n'),
	"type": "service_account",
	"project_id": "wians-discord-bot",
	"client_email": "firebase-adminsdk-x0px9@wians-discord-bot.iam.gserviceaccount.com",
	"client_id": "103320526212381101323",
	"auth_uri": "https://accounts.google.com/o/oauth2/auth",
	"token_uri": "https://oauth2.googleapis.com/token",
	"auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
	"client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-x0px9%40wians-discord-bot.iam.gserviceaccount.com"
}

module.exports = {
	account,
}