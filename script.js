document.getElementById("uploadBtn").addEventListener("click", () => {
    const files = document.getElementById("files").files;
    const format = document.getElementById("format").value;
    if (!files.length) return alert("Wybierz pliki");

    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    const userFilesDiv = document.getElementById("userFiles");

    for (let i=0;i<files.length;i++){
        const file = files[i];

        const container = document.createElement("div");
        container.className="progress-container";

        const thumb = document.createElement("img");
        thumb.className="thumb";

        const fileInfo = document.createElement("div");
        fileInfo.className="file-info";
        fileInfo.innerHTML=`<strong>${file.name}</strong>`;

        const progress = document.createElement("div");
        progress.className="progress-bar";

        const status = document.createElement("div");
        status.className="status";

        container.appendChild(thumb);
        container.appendChild(fileInfo);
        container.appendChild(progress);
        container.appendChild(status);
        resultsDiv.appendChild(container);

        // miniaturka
        if(file.type.startsWith("image/")){
            const reader = new FileReader();
            reader.onload = e => { thumb.src = e.target.result; };
            reader.readAsDataURL(file);
        }

        const formData = new FormData();
        formData.append("image", file);
        formData.append("format", format);

        const xhr = new XMLHttpRequest();
        xhr.open("POST","./upload.php",true);

        xhr.upload.onprogress = (e)=>{
            if(e.lengthComputable){
                const percent = Math.round((e.loaded/e.total)*100);
                progress.style.width=percent+"%";
                progress.textContent=percent+"%";
            }
        };

        xhr.onload = ()=>{
            if(xhr.status===200){
                const resp = JSON.parse(xhr.responseText);
                if(resp.status==="ok"){
                    progress.style.width="100%";
                    progress.style.background="blue";
                    status.innerHTML=`<strong>Pomyślnie!</strong> 
                        <a href='./download.php?file=${resp.file}' target='_blank'>Pobierz</a><br>
                        Rozmiar oryginalny: ${resp.size_original} B<br>
                        Rozmiar po konwersji: ${resp.size_converted} B<br>
                        Oszczędność: ${resp.saved_percent}%`;

                    // dodanie do cache userFiles
                    const a = document.createElement('a');
                    a.href='./download.php?file='+resp.file;
                    a.target='_blank';
                    a.textContent=resp.file;
                    userFilesDiv.appendChild(a);
                } else {
                    status.innerHTML=`<span style='color:red;'>Błąd: ${resp.message}</span>`;
                    progress.style.background="red";
                }
            } else {
                status.innerHTML=`<span style='color:red;'>Błąd wysyłki ${xhr.status}</span>`;
                progress.style.background="red";
            }
        };

        xhr.onerror = ()=>{
            status.innerHTML=`<span style='color:red;'>Błąd połączenia</span>`;
            progress.style.background="red";
        };

        xhr.send(formData);
    }
});
function loadUserCache() {
    fetch("./list.php")
        .then(r => r.json())
        .then(files => {
            const userFilesDiv = document.getElementById("userFiles");
            userFilesDiv.innerHTML = "";

            if (!files.length) {
                userFilesDiv.innerHTML = "<p>Brak zapisanych plików.</p>";
                return;
            }

            files.forEach(f => {
                const wrapper = document.createElement("div");
                wrapper.className = "cache-item";

                // miniatura
                const img = document.createElement("img");
                img.className = "cache-thumb";
                
                if (f.preview) {
                    img.src = f.url;
                } else {
                    img.src = "./placeholder.png"; // jeśli AVIF nie obsłuży miniatury
                }

                // link
                const a = document.createElement("a");
                a.href = "./download.php?file=" + f.file;
                a.target = "_blank";
                a.textContent = f.file;

                wrapper.appendChild(img);
                wrapper.appendChild(a);
                userFilesDiv.appendChild(wrapper);
            });
        });
}

// Załaduj przy starcie
document.addEventListener("DOMContentLoaded", loadUserCache);
let files = []; // ← tu wypełnisz danymi z PHP
let currentPage = 1;
const perPage = 8;

function loadFilesFromPhpSession(dataFromPhp) {
    files = dataFromPhp;  
    renderPage();
}

function renderPage() {
    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";

    const start = (currentPage - 1) * perPage;
    const end = start + perPage;

    const pageItems = files.slice(start, end);

    pageItems.forEach(f => {
        const img = document.createElement("img");
        img.src = "converted_files/" + f;
        gallery.appendChild(img);
    });

    document.getElementById("pageInfo").textContent =
        `Strona ${currentPage} / ${Math.ceil(files.length / perPage)}`;
}

document.getElementById("prevPage").onclick = () => {
    if (currentPage > 1) {
        currentPage--;
        renderPage();
    }
};

document.getElementById("nextPage").onclick = () => {
    if (currentPage < Math.ceil(files.length / perPage)) {
        currentPage++;
        renderPage();
    }
};
