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
    const canvas = document.querySelector("#signature-canvas");
    canvas.height = canvas.offsetHeight;
    canvas.width = canvas.offsetWidth;

    signaturePad = new SignaturePad(canvas, {});

    const form = document.querySelector('#form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        let email = document.getElementById('email').value;
        let nombres = document.getElementById('nombre').value;
        let apellidos = document.getElementById('apellido').value;
        let identificacion = document.getElementById('identificacion').value;

        // Validar el correo electrónico
        const isEmailValid = await validateEmail(email);
        const messageElement = document.getElementById('message');

        if (isEmailValid) {
            messageElement.textContent = '';
            generatePDF(nombres, apellidos, identificacion);
        } else {
            messageElement.textContent = 'No está registrado.';
            messageElement.style.color = 'red';
        }
    });
});

async function validateEmail(email) {
    const response = await fetch(`https://script.google.com/macros/s/AKfycbxLmulSsfmXnD-5sAAd8D7cnDXl4UAz-eP3DsTA-P5Xv21nhfaX_Z_ti2NgNP6tCEm8/exec?email=${encodeURIComponent(email)}`);
    const data = await response.json();
    return data.found; // Retorna true si el correo está registrado
}

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