FIELDS = [
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
];

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
  const table = document.createElement("table");
  const thead = fields_to_thead(FIELDS);
  const tbody = document.createElement("tbody");
  table.appendChild(thead);
  table.appendChild(tbody);

  const usernames = get_usernames();
  set_url_params(usernames);
  usernames.forEach((u) => {
    const csv = get_lifter_csv_from_openpl(u);
    if (csv == null) return;
    const rows = csv.split("\n");
    const results = rows.slice(1, -1).map((row) => parse_result(rows[0], row));
    const trs = results.map((result) => result_to_table_row(result));
    const blank_row = document.createElement("tr");
    blank_row.appendChild(document.createElement("td"));
    blank_row.classList.add("blank_row");
    trs.push(blank_row);
    trs.forEach((tr) => {
      tbody.appendChild(tr);
    });
  });
  tbody.removeChild(tbody.lastChild);
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

function map_field(field) {
  const m = {
    BodyweightKg: "Bodyweight",
    WeightClassKg: "Weight Class",
    Best3SquatKg: "Squat",
    Best3BenchKg: "Bench",
    Best3DeadliftKg: "Deadlift",
    TotalKg: "Total",
    ParentFederation: ""
  };
  if (field in m) return m[field];
  return field;
}

function fields_to_thead(fields) {
  const thead = document.createElement("thead");
  const tr = document.createElement("tr");
  fields.forEach((val) => {
    if (keep_header(val)) {
      const th = document.createElement("th");
      th.innerText = map_field(val);
      tr.appendChild(th);
    }
  });
  thead.appendChild(tr);
  return thead;
}

function result_to_table_row(result) {
  const table_row = document.createElement("tr");
  for (const field of FIELDS) {
    const th = document.createElement("th");
    if (field in result) {
      th.innerText = result[field];
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
  return FIELDS.includes(header);
}

function set_url_params(usernames) {
  window.history.replaceState(null, null, `?${usernames.join("&")}`);
}

function main() {
  const URL_USERS = get_usernames_from_url();
  const USERNAME_LIST = document.querySelector(".item_list");
  URL_USERS.forEach((username) =>
    USERNAME_LIST.appendChild(make_list_item(username))
  );
}

main();
