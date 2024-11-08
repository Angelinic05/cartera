

function loadImage(url) {
    return new Promise(resolve => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = "blob";
        xhr.onload = function (e) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const res = event.target.result;
                resolve(res);
            }
            const file = this.response;
            reader.readAsDataURL(file);
        }
        xhr.send();
    });
}

let signaturePad = null;

window.addEventListener('load', async () => {
    const canvas = document.querySelector("canvas");
    canvas.height = canvas.offsetHeight;
    canvas.width = canvas.offsetWidth;

    signaturePad = new SignaturePad(canvas, {});

    const form = document.querySelector('#form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        let nombres = document.getElementById('nombre').value;
        let apellidos = document.getElementById('apellido').value;
        let identificacion = document.getElementById('identificacion').value;

        generatePDF(nombres, apellidos, identificacion);
    });
});

async function generatePDF(nombres, apellidos, identificacion) {
    const image = await loadImage("formulario.jpg"); // Asegúrate de que esta imagen esté en la ruta correcta
    const signatureImage = signaturePad.toDataURL();

    const pdf = new jsPDF('p', 'pt', 'letter');

    pdf.addImage(image, 'PNG', 0, 0, 565, 792);
    pdf.addImage(signatureImage, 'PNG', 80, 650, 150, 60);

    pdf.setFontSize(8);
    pdf.text(nombres, 320, 127);
    pdf.text(apellidos, 370, 127);
    pdf.text(identificacion, 220, 140); // Añadir la identificación en el PDF

    pdf.save("example.pdf");
}