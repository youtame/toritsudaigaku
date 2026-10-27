# Getting Started

You can easily run Secure TASM locally using Docker and Docker Compose. Follow the steps below to set up and start the application on your environment.

![Secure TASM](/assets/image/image2.png)

### Prerequisites

Make sure you have the following software installed on your machine:

- **Docker**
- **Docker Compose**

### Installation Steps

1. **Clone the repository**
   Open your terminal and clone the project from GitHub, then navigate into the project directory:

    ```bash
    git clone git@github.com:youtame/toritsudaigaku.git
    cd toritsudaigaku
    ```

2. **Configure Environment Variables (Optional / If needed)**
   Copy the sample environment configuration file and adjust any necessary settings (such as database credentials or storage options) according to your local environment:

    ```bash
    cp .env.example .env
    ```

    ::: info NOTE
    Skip this step if the default configuration works out of the box for local testing.
    :::

3. **Build and start the Docker containers**
   Run Docker Compose in detached mode to build the images and start all required services:

    ```bash
    docker compose up -d --build
    ```

4. **Access the Application**
   Once the containers are up and running successfully, open your web browser and visit: [http://localhost:5173](http://localhost:5173)

5. **Stopping the Application**
   If you want to stop the running containers, run the following command in the project root directory:

    ```bash
    docker compose down
    ```

## Developer

Secure TASM is an open-source project. All source code is publicly available in our GitHub repository: **[github.com/youtame/toritsudaigaku](https://github.com/youtame/toritsudaigaku)**.

Our goal is to make the codebase accessible and usable for as many developers as possible.

### Key Development Details

- **Open Source & Contribution**

    We welcome community involvement. If you find any issues, security concerns, or have feature requests, please feel free to open an issue or submit a pull request on GitHub.

- **Modern Tech Stack**

    The entire codebase is built using widely adopted, developer-friendly technologies, primarily **Vue.js** and **TypeScript**. This makes it easy for developers of various backgrounds to understand, audit, and contribute to the project.

### Tech Stack & Libraries

| Library             | Version | Used for                      |
| :------------------ | :------ | :---------------------------- |
| Docker              | Latest  | Project execution environment |
| TypeScript          | ~6.0.0  | Site                          |
| Vue.js              | ^3.5.40 | Site                          |
| Vite                | ^8.1.5  | Site                          |
| Vuetify             | ^4.1.7  | Design                        |
| express             | 5.2.1   | Backend                       |
| google-auth-library | 10.6.2  | Google OAuth                  |
| helmet              | 8.2.0   | Backend                       |
| multer              | 2.1.1   | Backend                       |
| pg                  | 8.20.0  | Backend                       |
