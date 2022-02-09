# Image Annotation Tool

![IMA - Image annotation tool](https://ima.coders.tools/github.png)

Image annotation tool is a web application that allows users to mark zones of interest in an image. These zones are then converted to TEI P5 code snippet that can be used in your document to connect the image and the text. This tool was developed to help students and teachers at the [Faculty of Arts, Charles University](https://ff.cuni.cz/) to mark and annotate images of manuscripts.



## Usage
Visit [the app website](http://ima.coders.tools/), open your image and start annotating.
The app can be installed as PWA (Progressive Web App).

## Development
All contributions are welcomed. The web app is written in [React.js](https://facebook.github.io/react/) and uses [React Draggable](https://www.npmjs.com/package/react-draggable) for dragging tool panes.

### Prerequisites
- [Node.js](https://nodejs.org/en/)
- [Git](https://git-scm.com/)

Make sure you have installed the above libraries, otherwise you will not be able to run the app.

### Installation
First of all, you need to get your local clone of the application.

```bash
git clone git@github.com:silencesys/dh--image-annotation-tool.git ImageAnnotationTool
```

Then you need to install the dependencies.

```bash
cd ImageAnnotationTool
npm install
```

Next you can run the application. 
The application is running on port 3000.


## Used components and libraries
- [React](https://reactjs.org/)
- [OpenSeadragon](https://openseadragon.github.io/)
- [React Draggable](https://www.npmjs.com/package/react-draggable)
- [Font Awesome](https://fontawesome.com/)
