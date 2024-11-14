function loadImage(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = "blob";
        xhr.onload = function () {
            if (xhr.status === 200) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    resolve(event.target.result);
                };
                reader.readAsDataURL(xhr.response);
            } else {
                reject(new Error('Error al cargar la imagen'));
            }
        };
        xhr.onerror = () => reject(new Error('Error de red'));
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

        const fechaActual = new Date().toLocaleDateString();

        const validationResult = await validateEmail(email);
        const messageElement = document.getElementById('message');

        if (validationResult.found) {
            messageElement.textContent = '';
            const ciudad = validationResult.city;
            const cuotas = validationResult.cuotas;

            try {
                // Generar el PDF según la cantidad de cuotas
                let pdfPromise;
                if (cuotas === 3) {
                    pdfPromise = generatePDF(nombre, identificacion, fechaActual, direccion, telefono, email, ciudad, cuotas, "COMPROMISO DE PAGO3.jpg");
                } else if (cuotas === 5) {
                    pdfPromise = generatePDF(nombre, identificacion, fechaActual, direccion, telefono, email, ciudad, cuotas, "COMPROMISO DE PAGO5.jpg");
                } else {
                    messageElement.textContent = 'Cantidad de cuotas no válida.';
                    messageElement.style.color = 'red';
                    return;
                }

                const pdfBlob = await pdfPromise;

                // Generar documento de habeas data si es de Colombia
                if (validationResult.country.toLowerCase() === 'colombia') {
                    await generateHabeasPDF(fechaActual, identificacion, signaturePad.toDataURL());
                }

                messageElement.textContent = 'Documentos generados con éxito.';
                messageElement.style.color = 'green';

            } catch (error) {
                console.error("Error generando los documentos:", error);
                messageElement.textContent = 'Ocurrió un error al generar los documentos.';
                messageElement.style.color = 'red';
            }

        } else {
            messageElement.textContent = 'No está registrado.';
            messageElement.style.color = 'red';
        }
    });
});

async function validateEmail(email) {
    try {
        const response = await fetch(`https://script.google.com/macros/s/AKfycbxLmulSsfmXnD-5sAAd8D7cnDXl4UAz-eP3DsTA-P5Xv21nhfaX_Z_ti2NgNP6tCEm8/exec?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        console.log("Resultado de la validación de email:", data);
        return data;
    } catch (error) {
        console.error("Error en la validación de email:", error);
        return { found: false, country: '', city: '', cuotas: 0 };
    }
}

async function generatePDF(nombre, identificacion, fechaActual, direccion, telefono, email, ciudad, cuotas, imageFile) {
    const image = await loadImage(imageFile);
    const signatureImage = signaturePad.toDataURL();

    const pdf = new jsPDF('p', 'pt', 'letter');
    pdf.addImage(image, 'PNG', 0, 0, 565, 792);
    pdf.addImage(signatureImage, 'PNG', 80, 580, 150, 60);

    pdf.setFontSize(10);
    pdf.text(nombre, 210, 168);
    pdf.text(identificacion, 88, 198);
    pdf.text(fechaActual, 400, 125);
    pdf.text(direccion, 200, 185);
    pdf.text(telefono, 102, 668);
    pdf.text(email, 121, 688);
    pdf.text(ciudad, 130, 125);

    pdf.save("COMPROMISO_DE_PAGO.pdf");
    return pdf.output('blob');
}

async function generateHabeasPDF(fechaActual, identificacion, signatureImage) {
    const habeasImage = await loadImage("HABEAS DATA.jpg");

    const pdf = new jsPDF('p', 'pt', 'letter');
    pdf.addImage(habeasImage, 'PNG', 0, 0, 565, 792);
    pdf.setFontSize(10);
    pdf.text(fechaActual, 110, 196);
    pdf.text(identificacion, 85, 693);
    pdf.addImage(signatureImage, 'PNG', 110, 630, 140, 50);

    pdf.save("HABEAS_DATA.pdf");
    return pdf.output('blob');
}
