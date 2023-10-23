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

FIELD_MAPPING = new Map([
  ["BodyweightKg", "Bodyweight"],
  ["WeightClassKg", "Weight Class"],
  ["Best3SquatKg", "Squat"],
  ["Best3BenchKg", "Bench"],
  ["Best3DeadliftKg", "Deadlift"],
  ["TotalKg", "Total"],
  ["ParentFederation", "Parent Fed"],
  ["AgeClass", "Age Class"],
  ["BirthYearClass", "Age Class (IPF)"],
]);

SORTABLE = [
  "Best3SquatKg",
  "Best3BenchKg",
  "Best3DeadliftKg",
  "TotalKg",
  "Dots",
];

DEFAULT_SORT = "Dots";

RESULTS_CACHE = new Map();

FILTERS = [
  "Equipment",
  "Federation",
  "ParentFederation",
  "WeightClassKg",
  "AgeClass",
  "BirthYearClass",
];

function add_username() {
  const username_list = document.querySelector(".item_list");
  const username_entry = document.querySelector(".text_entry");
  if (username_entry.value === "") return;
  username_list.appendChild(make_list_item(username_entry.value));
  show_results();
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
    show_results();
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

async function get_lifter_csv_from_openpl(lifter_name) {
  const url = `https://www.openpowerlifting.org/api/liftercsv/${lifter_name}/`;
  const cors_proxy_url = `https://corsproxy.io/?${url}`;
  const response = await fetch(cors_proxy_url);
  if (!response.ok) {
    console.log(`Invalid lifter name "${lifter_name}"`);
    return null;
  }
  return response.text();
}

async function get_results(username) {
  if (!RESULTS_CACHE.has(username)) {
    const csv = await get_lifter_csv_from_openpl(username);
    if (csv === null) {
      RESULTS_CACHE.set(username, null);
    } else {
      const rows = csv.split("\n");
      RESULTS_CACHE.set(
        username,
        rows.slice(1, -1).map((row) => parse_result(rows[0], row))
      );
    }
  }
  return RESULTS_CACHE.get(username);
}

CURRENT_RESULTS = [];

async function show_results() {
  const container = document.getElementById("results");
  const old_list = container.querySelector("table");
  if (old_list) old_list.remove();
  const table = document.createElement("table");
  const thead = fields_to_thead(FIELDS);
  const tbody = document.createElement("tbody");
  table.appendChild(thead);
  table.appendChild(tbody);

  const filter_field = get_select_val();
  const only_best = true;
  const decouple = get_decouple_val();

  const usernames = get_usernames();
  set_url_params(usernames);

  CURRENT_RESULTS = [];
  const filter_func = get_filters_func(FILTERS);

  await Promise.all(
    usernames.map(async (username) => {
      let results = await get_results(username);
      if (results === null) return;
      CURRENT_RESULTS.push(...results);
      results = results.filter(filter_func);
      if (results.length == 0) return;
      if (only_best) {
        if (!decouple) results = [
          results.reduce((max, result) =>
            Number(max[filter_field]) > Number(result[filter_field])
              ? max
              : result
          ),
        ];
        else results = [
          results.reduce((prev, cur) => {
            let new_result = {...prev}
            for (field of ["Best3SquatKg", "Best3BenchKg", "Best3DeadliftKg", "TotalKg", "Dots"]) {
              new_result[field] = Number(prev[field]) > Number(cur[field]) ? prev[field] : cur[field];
            }
            return new_result;
          })
        ]
      }
      const trs = results.map((result) =>
        result_to_table_row(result, username)
      );
      const blank_row = document.createElement("tr");
      blank_row.classList.add("blank_row");
      const blank_row_el = document.createElement("td");
      blank_row_el.setAttribute("colspan", FIELDS.length);
      blank_row.appendChild(blank_row_el);
      // trs.push(blank_row);
      trs.forEach((tr) => {
        tbody.appendChild(tr);
      });
    })
  );

  const sort_field = filter_field;

  const blanks = tbody.querySelectorAll(".blank_row");
  const column_number = FIELDS.indexOf(sort_field);
  let rows = Array.from(tbody.querySelectorAll("tr:not(.blank_row)"));
  rows.sort((r1, r2) => {
    const v1 = Number(r1.children[column_number].textContent);
    const v2 = Number(r2.children[column_number].textContent);
    return v1 < v2 ? 1 : v1 > v2 ? -1 : 0;
  });
  rows.forEach((r, i) => {
    tbody.appendChild(r);
    if (i < blanks.length) tbody.appendChild(blanks[i]);
  });

  container.appendChild(table);

  populate_filters(FILTERS, CURRENT_RESULTS);
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
  if (FIELD_MAPPING.has(field)) return FIELD_MAPPING.get(field);
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

function result_to_table_row(result, username) {
  const table_row = document.createElement("tr");
  for (const field of FIELDS) {
    const td = document.createElement("td");
    if (field in result) {
      if (field == "Name" && username !== undefined) {
        td.innerHTML = `<a href=https://www.openpowerlifting.org/u/${username}/>${result[field]}</a>`;
        td.classList.add("name");
      } else {
        td.innerText = result[field];
      }
      if (field == "Best3SquatKg") td.classList.add("squat");
      if (field == "Best3BenchKg") td.classList.add("bench");
      if (field == "Best3DeadliftKg") td.classList.add("deadlift");
    }
    table_row.appendChild(td);
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
  window.history.replaceState(
    null,
    null,
    usernames.length ? `?${usernames.join("&")}` : window.location.pathname
  );
}

function populate_select() {
  const select_el = document.getElementById("filter_sort_select");
  SORTABLE.forEach((field) => {
    if (!FIELDS.includes(field)) return;
    const option = document.createElement("option");
    option.setAttribute("value", field);
    option.innerText = map_field(field);
    select_el.appendChild(option);
  });
  select_el.value = DEFAULT_SORT;
  select_el.addEventListener("change", (event) => show_results());
}

function get_select_val() {
  const select_el = document.getElementById("filter_sort_select");
  return select_el.value;
}

function decouple_update() {
  const decouple_el = document.getElementById("decouple");
  decouple_el.addEventListener("change", (event) => show_results());
}

function get_decouple_val() {
  const decouple_el = document.getElementById("decouple");
  return decouple_el.checked;
}

function create_field_filter(field) {
  const name = `filter_select_${field}`;
  const old = document.getElementById(name);
  if (old) old.remove();
  const select_el = document.createElement("select");
  select_el.id = name;
  select_el.name = name;

  const default_val = document.createElement("option");
  default_val.appendChild(document.createTextNode(`All ${map_field(field)}`));
  default_val.setAttribute("value", "-");
  select_el.appendChild(default_val);

  select_el.addEventListener("change", (event) => show_results());

  return select_el;
}

function add_filters(fields) {
  const filter_div = document.getElementById("filters");
  fields.forEach((field) => {
    filter_div.appendChild(create_field_filter(field));
  });
}

function populate_field_filter(field, results) {
  const select_el = document.getElementById(`filter_select_${field}`);
  const current_val = select_el.value;
  const values = new Set(
    results
      .map((result) => result[field])
      .filter((val) => val !== undefined && val !== "")
      .sort()
  );
  const new_children = [...values]
    .map((val) => {
      const el = document.createElement("option", { value: val });
      el.appendChild(document.createTextNode(val));
      return el;
    })
    .filter((val) => val !== null);
  select_el.replaceChildren(select_el.firstChild, ...new_children);
  select_el.value = current_val;
}

function populate_filters(fields, results) {
  fields.forEach((field) => {
    populate_field_filter(field, results);
  });
}

function get_filter_func(field) {
  const select_el = document.getElementById(`filter_select_${field}`);
  const val = select_el.value;
  return (result) => {
    return !(field in result) || val == "-" || result[field] == val;
  };
}

function get_filters_func(fields) {
  const funcs = fields.map((field) => get_filter_func(field));
  return (result) => {
    return funcs.every((func) => {
      return func(result);
    });
  };
}

function main() {
  populate_select();
  decouple_update();
  add_filters(FILTERS);
  const URL_USERS = get_usernames_from_url();
  const USERNAME_LIST = document.querySelector(".item_list");
  URL_USERS.forEach((username) =>
    USERNAME_LIST.appendChild(make_list_item(username))
  );
  show_results();
}

main();
