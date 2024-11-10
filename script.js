document.addEventListener("DOMContentLoaded", () => {
  const levelCards = document.querySelectorAll(".level-card");

  levelCards.forEach((card, index) => {
    card.addEventListener("click", () => {
      let level;
      if (index === 0) {
        level = "beginner";
      } else if (index === 1) {
        level = "advanced";
      } else {
        level = "expert";
      }

      localStorage.setItem("level", level);
      window.location.href = "/game";
    });
  });

  // Additional code for "see records" functionality can go here
  // For example:
  // document.querySelector(".see-records").addEventListener("click", () => {
  //   window.location.href = "/records";
  // });
});
