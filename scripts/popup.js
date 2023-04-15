const prevButton = document.getElementById("prevButton");
const imagesPrev = document.getElementById("imagesPrev")
const urlsContainer = document.getElementById("urlsContainer")
const urlsDiv = document.getElementById("urls")

prevButton.addEventListener("click",() => { 
    chrome.tabs.query({active: true}, function(tabs) {
        var tab = tabs[0];
        if (tab) {
            execScript(tab);
        } else {
            alert("Il n'y a pas d'onglet disponible")
        }
    })
})

function execScript(tab) {
    chrome.scripting.executeScript(
        {
            target:{tabId: tab.id, allFrames: true},
            func:getImages
        },
        onResult
    )
}

function getImages() {
    const images = document.querySelectorAll("img");
    return Array.from(images).map(image=>image.src);    
}

function onResult(frames) {
    if (!frames || !frames.length) { 
        alert("Impossible de récupérer une image de cette page.");
        return;
    }
    const imageUrls = frames.map(frame=>frame.result)
                            .reduce((r1,r2)=>r1.concat(r2));
    window.navigator.clipboard
          .writeText(imageUrls.join("\n"))
          .then(()=>{
          });
    imageUrls.forEach(url => addImageNode(imagesPrev, url))
}

function addImageNode(container, url) {
    const img = document.createElement("img");
    img.style.maxWidth = "200px"
    img.src = url;
    container.appendChild(img)
    prevButton.style.display = "none"
    urlsContainer.style.display = "block"
    const urlSpan = document.createElement("span")
    urlSpan.textContent = url
    urlsDiv.appendChild(urlSpan)
    // urls = urls.split(",")
    // urlsDiv.textContent = imageUrls

}

document.getElementById("downloadButton").addEventListener("click", async() => {
    try{
        const urls = getUrls()
        const file = await createZip(urls)
        downloadFile(file)
    } catch (err) {
        alert(err.message)
    }
})

function getUrls() {
    const urls = urlsDiv.textContent
    if(!urls || !urls.length) {
        throw new Error("Urls des images impossible à récupérer")
    }
    return urls;
}

async function createZip(urls) {
    const zip = new JSZip();
    urls = urls.split(",")
    for (let index in urls) {
        try {
            const url = urls[index];
            const response = await fetch(url);
            const blob = await response.blob();
            zip.file(setFileName(index, blob),blob);
        } catch (err) {
            console.error(err);
        }
    };
    return await zip.generateAsync({type:'blob'});
}

function setFileName(index, blob) {
    let name = parseInt(index)+1;
    [type, extension] = blob.type.split("/");
    if (type != "image" || blob.size <= 0) {
        throw Error("Images irrécupérables");
    }
    return name+"."+extension;
}

function downloadFile(file) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    console.log(file);
    link.download = "images.zip"; 
    console.log(link);       
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);    
}