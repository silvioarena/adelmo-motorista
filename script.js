const buttons = document.querySelectorAll(".button");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    console.log("Solicitacao de viagem iniciada pelo site Adelmo Motorista.");
  });
});
