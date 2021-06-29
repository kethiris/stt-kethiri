
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]



<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/kth012/stt-kethiri">
    <img src="images/STT_Logo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Speech to Text Transcriber </h3>

  <p align="center">
    Transcriber based on Watsons STT service
    <br />
    <a href="https://github.com/kth012/stt-kethiri"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/kth012/stt-kethiri">View Demo</a>
    ·
    <a href="https://github.com/kth012/stt-kethiri/issues">Report Bug</a>
    ·
    <a href="https://github.com/kth012/stt-kethiri/issues">Request Feature</a>
  </p>
</p>



<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary><h2 style="display: inline-block">Table of Contents</h2></summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgements">Acknowledgements</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

This project is based on Watson speech to text service. Project is implemented in NodeJS with a PostgreSQL database. It is currenlty being hosted in heroku free tier instance.

The project uses express web framework to cater the user requests.

Application can perform transcription on .mp4 .m4a .mp3 files.

<a href="https://stt-kethiri.herokuapp.com/">[Browse Application](https://stt-kethiri.herokuapp.com/)</a>



<!-- GETTING STARTED -->
## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites
1.    Node
2.    Watsons speech to text service API key
3.    PostgreSQL database


### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/kth012/stt-kethiri.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Set the environment variables
    ```sh
    export DATABASE_URL= ""
    export STT_API_KEY= ""
    export STT_SERVICE_URL= ""
    export PORT = ""
    ```

<!-- USAGE EXAMPLES -->
## Usage

### User Registration

![register-page-ss]  

### User Login

![login-page-ss]  

### File Upload

![fileupload-page-ss]  

### Transcription Response

![transcriptionresponse-page-ss]  

### Results

Results can also be obtained via REST endpoint  
https://stt-kethiri.herokuapp.com/result?username=abc?password=xxx

![result-page-ss]  


<!-- ROADMAP -->
## Roadmap

See the [open issues](https://github.com/kth012/stt-kethiri/issues) for a list of proposed features (and known issues).



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



<!-- LICENSE -->
## License

Distributed under the GPLv3.0 License. See `LICENSE` for more information.



<!-- CONTACT -->
## Contact

Kethiri Sundaralingam - [@skethiri93](https://twitter.com/skethiri) - skethiri93@gmail.com

Project Link: [https://github.com/kth012/stt-kethiri](https://github.com/kth012/stt-kethiri)



<!-- ACKNOWLEDGEMENTS -->
## Acknowledgements

* [ibm-watson](https://github.com/watson-developer-cloud/node-sdk)
* [express](https://github.com/expressjs/express)
* [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)
* [pg](https://github.com/brianc/node-postgres)
* [formidable](https://github.com/node-formidable/formidable)
* [bcrypt](https://github.com/kelektiv/node.bcrypt.js)
* [express-session](https://github.com/expressjs/session)
* [ffmpeg-installer](https://github.com/kribblo/node-ffmpeg-installer)
* [ejs](https://github.com/mde/ejs)
* [body-parser](https://github.com/expressjs/body-parser)
* [mv](https://github.com/andrewrk/node-mv)
  
<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/kth012/stt-kethiri.svg?style=for-the-badge
[contributors-url]: https://github.com/kth012/stt-kethiri/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/kth012/stt-kethiri.svg?style=for-the-badge
[forks-url]: https://github.com/kth012/stt-kethiri/network/members
[stars-shield]: https://img.shields.io/github/stars/kth012/stt-kethiri.svg?style=for-the-badge
[stars-url]: https://github.com/kth012/stt-kethiri/stargazers
[issues-shield]: https://img.shields.io/github/issues/kth012/stt-kethiri.svg?style=for-the-badge
[issues-url]: https://github.com/kth012/stt-kethiri/issues
[license-shield]: https://img.shields.io/github/license/kth012/stt-kethiri.svg?style=for-the-badge
[license-url]: https://github.com/kth012/stt-kethiri/blob/main/LICENSE
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/kethiris
[login-page-ss]: images/LoginPage.PNG
[register-page-ss]: images/RegisterPage.PNG
[fileupload-page-ss]: images/FileUploadPage.PNG
[transcriptionresponse-page-ss]: images/TranscriptionResponsePage.PNG
[result-page-ss]: images/ResultsPage.PNG
