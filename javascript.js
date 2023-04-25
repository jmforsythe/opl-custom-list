function add_username() {
  const username_list = document.querySelector(".item_list");
  const username_entry = document.querySelector(".text_entry");
  username_list.appendChild(make_list_item(username_entry.value));
}

function make_list_item(text) {
  let el = document.createElement("div");
  el.classList.add("list_item");
  let text_el = document.createElement("div");
  el.appendChild(text_el);
  text_el.classList.add("list_item_text");
  text_el.innerText = text;
  let close_button = document.createElement("button");
  el.appendChild(close_button);
  close_button.innerText = "x";
  close_button.width = "1em";
  close_button.classList.add("close_button");
  close_button.onclick = () => {
    el.parentElement.removeChild(el);
  };
  return el;
}

function get_usernames() {
  const username_list = document.querySelector(".item_list");
  const children = username_list.querySelectorAll(".list_item");
  let usernames = [];
  children.forEach((c) => {
    usernames.push(c.querySelector(".list_item_text").innerText);
  });
  return usernames;
}

function get_lifter_csv_from_openpl(lifter_name) {
  const url = `https://www.openpowerlifting.org/api/liftercsv/${lifter_name}/`;
  const cors_proxy_url = `https://corsproxy.io/?${url}`;
  const xmlhttp = new XMLHttpRequest();
  let result = null;
  xmlhttp.open("GET", cors_proxy_url, false);
  xmlhttp.send();
  if (xmlhttp.status == 200) {
    result = xmlhttp.responseText;
  }
  return result;
}

function show_results() {
  const container = document.getElementById("results");
  const old_list = container.querySelector(".item_list");
  if (old_list) old_list.remove();
  const new_list = document.createElement("div");
  new_list.classList.add("item_list");

  const usernames = get_usernames();
  usernames.forEach((u) => {
    const csv = get_lifter_csv_from_openpl(u);
    if (csv == null) return;
    const el = document.createElement("div");
    el.classList.add("list_item");
    new_list.appendChild(el);
    el.innerText = csv;
  });
  container.appendChild(new_list);
}
