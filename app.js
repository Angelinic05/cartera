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

        // Obtener la fecha actual
        let fechaActual = new Date().toLocaleDateString();

        // Validar el correo electrónico y obtener el país y la ciudad
        const validationResult = await validateEmail(email);
        const messageElement = document.getElementById('message');

        if (validationResult.found) {
            messageElement.textContent = '';

            // Generar el PDF principal con la ciudad de Google Sheets
            await generatePDF(nombre, identificacion, fechaActual, direccion, telefono, email, validationResult.city);

            // Si el país es "Colombia" en la respuesta, generar también el documento de habeas data
            if (validationResult.country.toLowerCase() === 'colombia') {
                await generateHabeasPDF(fechaActual, identificacion, signaturePad.toDataURL());
            }

            // Enviar el PDF generado por correo
            await sendSimpleEmail(email);
        } else {
            messageElement.textContent = 'No está registrado.';
            messageElement.style.color = 'red';
        }
    });
});

async function validateEmail(email) {
    const response = await fetch(`https://script.google.com/macros/s/AKfycbxLmulSsfmXnD-5sAAd8D7cnDXl4UAz-eP3DsTA-P5Xv21nhfaX_Z_ti2NgNP6tCEm8/exec?email=${encodeURIComponent(email)}`);
    const data = await response.json();
    return data; // Retorna un objeto con { found, country, city }
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
    pdf.text(ciudad, 130, 120);            // Ciudad desde Google Sheets

    const pdfBlob = pdf.output('blob');

    // Crear un enlace de descarga para el archivo generado
    const link = document.createElement('a');
    link.href = URL.createObjectURL(pdfBlob);  // Crear un enlace de descarga para el PDF
    link.download = "COMPROMISO DE PAGO.pdf";   // Nombre del archivo a descargar
    link.click();  // Simular un clic para iniciar la descarga
}

async function generateHabeasPDF(fechaActual, identificacion, signatureImage) {
    const habeasImage = await loadImage("HABEAS DATA.jpg");

    const pdf = new jsPDF('p', 'pt', 'letter');
    pdf.addImage(habeasImage, 'PNG', 0, 0, 565, 792); // Añade habeas.jpg como fondo

    pdf.setFontSize(10);
    pdf.text(fechaActual, 110, 196);        // Ajusta posición para la fecha
    pdf.text(identificacion, 85, 693);     // Ajusta posición para la identificación
    pdf.addImage(signatureImage, 'PNG', 110, 630, 140, 50);  // Firma en una posición ajustada

    pdf.save("HABEAS DATA.pdf");
}

async function sendSimpleEmail(email) {
    // Preparar los datos para enviar
    const formData = new FormData();
    formData.append('toEmail', email);  // Correo recibido del formulario
    formData.append('ccEmail', 'angeliloza01@gmail.com'); // Correo adicional

    // Enviar los datos al servidor utilizando fetch
    const response = await fetch('https://script.google.com/macros/s/AKfycbxLmulSsfmXnD-5sAAd8D7cnDXl4UAz-eP3DsTA-P5Xv21nhfaX_Z_ti2NgNP6tCEm8/exec', {
        method: 'POST',
        body: formData
    });

    const result = await response.json();
    console.log("Resultado de la respuesta del servidor:", result);
    
    if (result.status === 'success') {
        alert('Correo enviado correctamente.');
    } else {
        alert('Error al enviar el correo.');
    }
}    