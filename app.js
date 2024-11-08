function loadImage(url) {
    return new Promise(resolve => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = "blob";
        xhr.onload = function (e) {
            const reader = new FileReader();
            reader.onload = function (event) {
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
        let nombre = document.getElementById('nombre').value;
        let identificacion = document.getElementById('identificacion').value;
        let direccion = document.getElementById('direccion').value;
        let telefono = document.getElementById('telefono').value;
        let ciudad = document.getElementById('ciudad').value;
        let pais = document.getElementById('pais').value.toLowerCase();

        // Obtener la fecha actual
        let fechaActual = new Date().toLocaleDateString();

        // Validar el correo electrónico
        const isEmailValid = await validateEmail(email);
        const messageElement = document.getElementById('message');

        if (isEmailValid) {
            messageElement.textContent = '';

            // Generar el PDF principal
            await generatePDF(nombre, identificacion, fechaActual, direccion, telefono, email, ciudad);

            // Si el país es Colombia, generar también el documento de habeas
            if (pais === 'colombia') {
                await generateHabeasPDF(fechaActual, identificacion, signaturePad.toDataURL());
            }
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

async function generatePDF(nombre, identificacion, fechaActual, direccion, telefono, email, ciudad) {
    const image = await loadImage("COMPROMISO DE PAGO.jpg");
    const signatureImage = signaturePad.toDataURL();

    const pdf = new jsPDF('p', 'pt', 'letter');
    pdf.addImage(image, 'PNG', 0, 0, 565, 792);
    pdf.addImage(signatureImage, 'PNG', 80, 580, 150, 60);

    pdf.setFontSize(10);
    pdf.text(nombre, 210, 162);            // Nombre
    pdf.text(identificacion, 88, 193);     // Identificación
    pdf.text(fechaActual, 400, 120);       // Fecha
    pdf.text(direccion, 200, 180);         // Dirección
    pdf.text(telefono, 113, 669);          // Teléfono
    pdf.text(email, 121, 690);             // Email
    pdf.text(ciudad, 130, 120);         // Cantidad de cuotas (ajusta posición según el diseño)

    pdf.save("Compromiso de pago.pdf");
}

async function generateHabeasPDF(fechaActual, identificacion, signatureImage) {
    const habeasImage = await loadImage("HABEAS DATA.jpg");

    const pdf = new jsPDF('p', 'pt', 'letter');
    pdf.addImage(habeasImage, 'PNG', 0, 0, 565, 792); // Añade habeas.jpg como fondo

    pdf.setFontSize(10);
    pdf.text(fechaActual, 110, 196);        // Ajusta posición para la fecha
    pdf.text(identificacion, 85, 693);     // Ajusta posición para la identificación
    pdf.addImage(signatureImage, 'PNG', 110, 630, 140, 50);  // Firma en una posición ajustada

    pdf.save("habeas.pdf");
}
