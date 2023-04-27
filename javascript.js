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
  const old_list = container.querySelector("table");
  if (old_list) old_list.remove();
  let header_text = undefined;
  const table = document.createElement("table");
  let thead = undefined;

  const usernames = get_usernames();
  usernames.forEach((u) => {
    const csv = get_lifter_csv_from_openpl(u);
    const rows = csv.split("\n");
    if (csv == null) return;
    const results = rows.slice(1, -1).map((row) => parse_result(rows[0], row));
    if (header_text === undefined) {
      header_text = rows[0];
      thead = header_text_to_thead(header_text);
      table.appendChild(thead);
    }
    const trs = results.map((result) => result_to_table_row(thead, result));
    trs.forEach((tr) => { table.appendChild(tr) });
  });
  container.appendChild(table);
}

function get_usernames_from_url() {
  const url_params = window.location.search.substring(1);
  return url_params ? url_params.split("&") : [];
}

function parse_result(header_text, result_text) {
  const keys = header_text.split(",");
  const vals = result_text.split(",");
  let out = {};
  keys.forEach((key, index) => {
    out[key] = vals[index];
  });
  return out;
}

function header_text_to_thead(header_text) {
  const thead = document.createElement("thead");
  header_text.split(",").forEach((val) => {
    if (keep_header(val)) {
      const th = document.createElement("th");
      th.innerText = val;
      thead.appendChild(th);
    }
  })
  return thead;
}

function result_to_table_row(thead, result) {
  const table_row = document.createElement("tr");
  for (const column of thead.children) {
    const th = document.createElement("th");
    const key = column.innerText;
    if (key in result) {
      th.innerText = result[key];
    }
    table_row.appendChild(th);
  }
  return table_row;
}

function get_best(results, key) {
  return results.reduce((max, result) =>
    result[key] > max ? result[key] : max
  );
}

function keep_header(header) {
  return [
    "Name",
    "Sex",
    "Equipment",
    "Age",
    "Division",
    "BodyweightKg",
    "WeightClassKg",
    "Best3SquatKg",
    "Best3BenchKg",
    "Best3DeadliftKg",
    "TotalKg",
    "Dots",
    "Federation",
    "ParentFederation",
    "Date",
  ].includes(header);
}

function main() {
  const URL_USERS = get_usernames_from_url();
  const USERNAME_LIST = document.querySelector(".item_list");
  URL_USERS.forEach((username) =>
    USERNAME_LIST.appendChild(make_list_item(username))
  );
}

main();
