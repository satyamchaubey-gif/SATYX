const form = document.getElementById('orderForm');
const file = document.getElementById('designFile');
const fileName = document.getElementById('fileName');
const toast = document.getElementById('toast');

file.addEventListener('change', () => {
  fileName.textContent = file.files.length ? file.files[0].name : 'Upload your design';
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const name = data.get('name');
  const phone = data.get('phone');
  const qty = data.get('quantity');
  const color = data.get('color');
  const details = data.get('details') || 'Not specified';
  const fileText = file.files.length ? file.files[0].name : 'No file attached';

  // Replace this number with your SATYX WhatsApp business number.
  const whatsappNumber = '919999999999';

  const message =
`Hi SATYX! I want to place a custom T-shirt enquiry.

Name: ${name}
Phone: ${phone}
Quantity: ${qty}
T-shirt: ${color}
Design details: ${details}
Design file: ${fileText}

Please share the quote and next steps.`;

  toast.classList.add('show');
  setTimeout(() => {
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    toast.classList.remove('show');
  }, 600);
});

document.querySelector('.menu-btn').addEventListener('click', () => {
  const nav = document.querySelector('nav');
  const open = nav.style.display === 'flex';
  nav.style.display = open ? '' : 'flex';
  if (!open) {
    nav.style.position = 'absolute';
    nav.style.top = '108px';
    nav.style.left = '0';
    nav.style.right = '0';
    nav.style.padding = '20px 5vw';
    nav.style.background = '#f4f4ef';
    nav.style.flexDirection = 'column';
    nav.style.borderBottom = '1px solid #ddd';
  }
});
