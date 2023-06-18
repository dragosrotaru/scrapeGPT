function fillFormAndSubmit(inputs) {
  page.evaluate((inputs) => {
    document.getElementById("person_nm").value = inputs.lastName;
    document.getElementById("first_nm").value = inputs.firstName;
    document.querySelector("form[name='Next']").submit();
  }, inputs);
}
