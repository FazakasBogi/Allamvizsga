function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawElectronicsIcon(ctx, cx, cy) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1.18, 1.18);

  ctx.strokeStyle = "#245c45";
  ctx.fillStyle = "#f7f5ee";
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";

  drawRoundedRect(ctx, -42, -30, 84, 54, 6);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-54, 38);
  ctx.lineTo(54, 38);
  ctx.lineTo(42, 24);
  ctx.lineTo(-42, 24);
  ctx.closePath();
  ctx.fillStyle = "#edf2ea";
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#2f7f7b";
  ctx.fillRect(-26, -16, 52, 8);
  ctx.fillStyle = "#d6a84f";
  ctx.fillRect(-26, 0, 34, 8);

  ctx.strokeStyle = "#b66f45";
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 34, -22, 22, 42, 5);
  ctx.stroke();

  ctx.fillStyle = "#b66f45";
  ctx.beginPath();
  ctx.arc(45, 14, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawTextOnArc(ctx, text, cx, cy, radius, centerAngle, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = "700 23px Segoe UI, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const letters = [...text];
  const spacing = 20 / radius;
  const startAngle = centerAngle - ((letters.length - 1) * spacing) / 2;

  letters.forEach((letter, index) => {
    const angle = startAngle + index * spacing;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(letter, 0, 0);
    ctx.restore();
  });

  ctx.restore();
}

function drawCycle(time = 0) {
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.35;
  const colors = ["#245c45", "#2f7f7b", "#d6a84f", "#b66f45"];
  const labels = ["vásárlás", "javítás", "újrahasználat", "leadás"];
  const rotation = time / 1800;

  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.translate(-cx, -cy);

  ctx.lineWidth = 34;
  ctx.lineCap = "round";

  for (let i = 0; i < 4; i += 1) {
    const start = -Math.PI / 2 + i * (Math.PI / 2) + 0.12;
    const end = start + Math.PI / 2 - 0.28;
    const labelAngle = start + (end - start) / 2;

    ctx.beginPath();
    ctx.strokeStyle = colors[i];
    ctx.arc(cx, cy, radius, start, end);
    ctx.stroke();

    const ax = cx + Math.cos(end) * radius;
    const ay = cy + Math.sin(end) * radius;

    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(end + Math.PI / 2);
    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(8, 8);
    ctx.lineTo(-8, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    drawTextOnArc(ctx, labels[i], cx, cy, radius + 68, labelAngle, colors[i]);
  }

  ctx.restore();

  const pulse = 1 + Math.sin(time / 700) * 0.025;
  ctx.beginPath();
  ctx.fillStyle = "#f7f5ee";
  ctx.strokeStyle = "#d8ded4";
  ctx.lineWidth = 2;
  ctx.arc(cx, cy, radius * 0.54 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  drawElectronicsIcon(ctx, cx, cy);
  requestAnimationFrame(drawCycle);
}

function updateActiveNav() {
  const current = sections
    .map((section) => ({
      id: section.id,
      top: Math.abs(section.getBoundingClientRect().top - 120),
    }))
    .sort((a, b) => a.top - b.top)[0];

  if (!current) return;

  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${current.id}`;
    link.classList.toggle("active", isActive);
  });
}

window.drawCycle = drawCycle;
window.updateActiveNav = updateActiveNav;
