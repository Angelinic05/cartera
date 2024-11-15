// Función para cargar una imagen y convertirla a base64
async function loadImage(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = "blob";
        xhr.onload = () => {
            if (xhr.status === 200) {
                const reader = new FileReader();
                reader.onload = (event) => resolve(event.target.result);
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

// Inicializa el canvas y el formulario al cargar la página
window.addEventListener('load', async () => {
    const canvas = document.querySelector("#signature-canvas");
    canvas.height = canvas.offsetHeight;
    canvas.width = canvas.offsetWidth;

    signaturePad = new SignaturePad(canvas);

    const form = document.querySelector('#form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Obtiene datos del formulario
        const email = document.getElementById('email').value;
        const nombre = document.getElementById('nombre').value;
        const identificacion = document.getElementById('identificacion').value;
        const direccion = document.getElementById('direccion').value;
        const telefono = document.getElementById('telefono').value;

        const fechaActual = new Date().toLocaleDateString();
        const ciudad = "Ciudad genérica";

        // Genera los PDFs
        const pdfCompromisoBlob = await generatePDF(nombre, identificacion, fechaActual, direccion, telefono, email, ciudad);
        const pdfHabeasBlob = await generateHabeasPDF(fechaActual, identificacion, signaturePad.toDataURL());

        // Envía los PDFs por correo
        await sendEmail(pdfCompromisoBlob, pdfHabeasBlob);
    });
});

// Genera el PDF de compromiso
async function generatePDF(nombre, identificacion, fechaActual, direccion, telefono, email, ciudad) {
    const image = await loadImage("COMPROMISO DE PAGO.jpg");
    const signatureImage = signaturePad.toDataURL();

    const pdf = new jsPDF('p', 'pt', 'letter');
    pdf.addImage(image, 'PNG', 0, 0, 565, 792);
    pdf.addImage(signatureImage, 'PNG', 80, 580, 150, 60);

    pdf.setFontSize(10);
    pdf.text(nombre, 210, 162);
    pdf.text(identificacion, 88, 193);
    pdf.text(fechaActual, 400, 120);
    pdf.text(direccion, 200, 180);
    pdf.text(telefono, 113, 669);
    pdf.text(email, 121, 690);
    pdf.text(ciudad, 130, 120);

    return pdf.output('blob');
}

// Genera el PDF de habeas data
async function generateHabeasPDF(fechaActual, identificacion, signatureImage) {
    const habeasImage = await loadImage("HABEAS DATA.jpg");

    const pdf = new jsPDF('p', 'pt', 'letter');
    pdf.addImage(habeasImage, 'PNG', 0, 0, 565, 792);
    pdf.setFontSize(10);
    pdf.text(fechaActual, 110, 196);
    pdf.text(identificacion, 85, 693);
    pdf.addImage(signatureImage, 'PNG', 110, 630, 140, 50);

    return pdf.output('blob');
}

// Envía los PDFs por correo usando Email.js
async function sendEmail(pdfCompromisoBlob, pdfHabeasBlob) {
    const formData = new FormData();
    formData.append('compromiso', pdfCompromisoBlob, 'COMPROMISO_DE_PAGO.pdf');
    formData.append('habeas', pdfHabeasBlob, 'HABEAS_DATA.pdf');

    try {
        const response = await emailjs.sendForm(
            'service_zsnah7g',
            'template_qrwq4pi',
            formData,
            '1fTlnJ6lWrRKXSSki'
        );
        console.log('Correo enviado con éxito', response.status, response.text);
    } catch (error) {
        console.error('Error al enviar el correo:', error);
    }
}
