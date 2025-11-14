module.exports = {
  apps : [{
    name   : "readlens",
    script : "./bin/www.js",
	env: {
	NODE_ENV: "production",
	PORT: 80,
	DATABASE_URL: "postgresql://postgres.kmlguehbqqfgniytgbhn:9bmyeeXwgQ7Mt0aA@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres",
	JWT_SECRET: "SECRET",
	GEMINI_API_KEY:"AIzaSyAcP3m4HeKcYpY3jRxOyHCqUfIdrHVrxig",
	GOOGLE_CLIENT_ID:"480375095107-a31s1hvrlb7i4tvhl4i152k03dm326tr.apps.googleusercontent.com",
	}
  }]
}
