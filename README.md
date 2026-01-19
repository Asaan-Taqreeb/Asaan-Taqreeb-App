# Asaan Taqreeb (Easy Event) - FYP
Event Management System connecting Vendors and Clients.

## 📂 Project Structure
This is a Monorepo containing both the backend and frontend:
* **`/backend`**: Django REST Framework (API & Database)
* **`/mobile-app`**: React Native (Expo)

---

## 🚀 Getting Started
Follow these steps strictly to set up the project on your machine after pulling.

### 1. Clone the Repository
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd asaan-taqreeb

# 1. Navigate to the backend folder
cd backend

# 2. Create a virtual environment
python -m venv venv

# 3. Activate the environment
# IF USING GIT BASH (Windows):
source venv/Scripts/activate
# IF USING COMMAND PROMPT (Windows):
# venv\Scripts\activate
# IF USING MAC/LINUX:
# source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Set up the local database
python manage.py migrate

# 6. Run the server
python manage.py runserver

# 1. Go to the mobile app folder (from root)
cd mobile-app

# 2. Install JavaScript packages
npm install

# 3. Start the app
npx expo start
