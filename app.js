function loadImage(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = "blob";
        xhr.onload = function (e) {
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
let signaturePad = null; // Definir fuera de la función para que sea global

window.addEventListener('load', async () => {
    const canvas = document.querySelector("#signature-canvas");
    canvas.height = canvas.offsetHeight;
    canvas.width = canvas.offsetWidth;

    // Inicializar una única instancia de SignaturePad
    signaturePad = new SignaturePad(canvas, {});

    const form = document.querySelector('#form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Obtener los valores de los campos del formulario
        let email = document.getElementById('email').value;
        let nombre = document.getElementById('nombre').value;
        let identificacion = document.getElementById('identificacion').value;
        let direccion = document.getElementById('direccion').value;
        let telefono = document.getElementById('telefono').value;

        // Obtener la fecha actual
        const fechaActual = new Date().toLocaleDateString();

        // Validar el correo electrónico y obtener el país, la ciudad y si ya fue generado
        const validationResult = await validateEmail(email);
        const messageElement = document.getElementById('message');

        if (validationResult.found) {
            

            // Continuar con la generación si no fue generado previamente
            messageElement.textContent = '';

            // Asignar la ciudad desde la validación
            const ciudad = validationResult.city;

            // Generar el PDF de compromiso
            const pdfCompromisoBlob = await generatePDF(nombre, identificacion, fechaActual, direccion, telefono, email, ciudad);

            // Si el país es "Colombia", generar también el documento de habeas data
            let pdfHabeasBlob = null;
            if (validationResult.country.toLowerCase() === 'colombia') {
                pdfHabeasBlob = await generateHabeasPDF(fechaActual, identificacion, signaturePad.toDataURL());
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
        return data; // Retorna un objeto con { found, country, city }
    } catch (error) {
        console.error("Error en la validación de email:", error);
        return { found: false, country: '', city: '' }; // Retorna un objeto por defecto en caso de error
    }
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
    pdf.text(telefono , 113, 669);          // Teléfono
    pdf.text(email, 121, 690);             // Email
    pdf.text(ciudad, 130, 120);            // Ciudad desde Google Sheets

    pdf.save("COMPROMISO DE PAGO.pdf");
    return pdf.output('blob');
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
    return pdf.output('blob');
}

