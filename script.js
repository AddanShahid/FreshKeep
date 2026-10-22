
const foodForm = document.getElementById("food-form");
const foodNameInput = document.getElementById("food-name");
const foodCategoryInput = document.getElementById("food-category");
const foodDateInput = document.getElementById("food-date");
const foodList = document.getElementById("food-list");
const foodFilter = document.getElementById("food-filter");
const recipeList = document.getElementById("recipe-list");
const totalCount = document.getElementById("total-count");
const expiringCount = document.getElementById("expiring-count");
const usedCount = document.getElementById("used-count");
const toast = document.getElementById("toast");

let foods = loadFoods();
let usedItems = Number(localStorage.getItem("freshkeep-used") || 0);
let toastTimeout;

const recipes = [
    {
        name: "Omelett",
        ingredients: ["egg", "eggs", "egg", "cheese", "ost", "spinach", "spinat", "tomato", "tomat"],
        displayIngredients: "Egg, ost og grønnsaker",
        instructions: "Visp eggene. Stek dem i en panne og tilsett ost og grønnsaker. Stek til omeletten er fast."
    },
    {
        name: "Pannekaker",
        ingredients: ["milk", "melk", "egg", "eggs", "flour", "mel", "butter", "smør"],
        displayIngredients: "Melk, egg og mel",
        instructions: "Bland melk, egg og mel til en jevn røre. Stek små pannekaker i en varm panne."
    },
    {
        name: "Fruktsalat",
        ingredients: ["apple", "eple", "banana", "banan", "orange", "appelsin", "grape", "druer", "pear", "pære"],
        displayIngredients: "Frukt du har hjemme",
        instructions: "Vask frukten, skjær den i biter og bland alt i en bolle. Server med yoghurt hvis du har."
    },
    {
        name: "Grønnsakssuppe",
        ingredients: ["carrot", "gulrot", "potato", "potet", "onion", "løk", "broccoli", "brokkoli"],
        displayIngredients: "Gulrot, potet, løk og andre grønnsaker",
        instructions: "Kutt grønnsakene i biter. Kok dem i vann eller buljong til de er møre. Smak til med krydder."
    },
    {
        name: "Ostesmørbrød",
        ingredients: ["bread", "brød", "cheese", "ost", "tomato", "tomat", "ham", "skinke"],
        displayIngredients: "Brød, ost og valgfritt pålegg",
        instructions: "Legg ost og ønsket pålegg på brødet. Stek i ovnen eller en panne til osten har smeltet."
    },
    {
        name: "Yoghurt med frukt",
        ingredients: ["yoghurt", "yogurt", "banana", "banan", "berries", "bær", "apple", "eple"],
        displayIngredients: "Yoghurt og frukt eller bær",
        instructions: "Ha yoghurt i en bolle. Skjær opp frukt eller tilsett bær og bland sammen."
    }
];

function loadFoods() {
    try {
        const savedFoods = JSON.parse(localStorage.getItem("freshkeep-foods") || "[]");
        return Array.isArray(savedFoods) ? savedFoods : [];
    } catch {
        return [];
    }
}

function saveFoods() {
    localStorage.setItem("freshkeep-foods", JSON.stringify(foods));
    localStorage.setItem("freshkeep-used", String(usedItems));
}

function getDaysLeft(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiryDate = new Date(dateString + "T00:00:00");
    expiryDate.setHours(0, 0, 0, 0);

    return Math.round((expiryDate - today) / (1000 * 60 * 60 * 24));
}

function getStatus(food) {
    const days = getDaysLeft(food.expiryDate);

    if (days < 0) {
        return { label: "Utgått på dato", className: "expired" };
    }

    if (days === 0) {
        return { label: "Går ut i dag", className: "expired" };
    }

    if (days <= 3) {
        return {
            label: `${days} dag${days === 1 ? "" : "er"} igjen`,
            className: "soon"
        };
    }

    return {
        label: `${days} dager igjen`,
        className: ""
    };
}

function getEmoji(category) {
    const emojis = {
        "Meieri": "🥛",
        "Frukt og grønt": "🥑",
        "Kjøtt og fisk": "🐟",
        "Tørrvarer": "🌾",
        "Annet": "🧺"
    };

    return emojis[category] || "🧺";
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function renderFoods() {
    const filter = foodFilter.value;

    const filteredFoods = foods
        .filter(food => {
            const days = getDaysLeft(food.expiryDate);

            if (filter === "soon") return days >= 0 && days <= 3;
            if (filter === "expired") return days < 0;

            return true;
        })
        .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

    totalCount.textContent = foods.length;

    expiringCount.textContent = foods.filter(food => {
        const days = getDaysLeft(food.expiryDate);
        return days >= 0 && days <= 3;
    }).length;

    usedCount.textContent = usedItems;

    if (filteredFoods.length === 0) {
        foodList.innerHTML = `
            <div class="empty-state">
                <span>🥦</span>
                <h3>${foods.length === 0 ? "Kjøleskapet er tomt" : "Ingen varer her"}</h3>
                <p>${foods.length === 0
                    ? "Legg til din første matvare for å komme i gang!"
                    : "Prøv å velge et annet filter."}</p>
            </div>
        `;
        return;
    }

    foodList.innerHTML = filteredFoods.map(food => {
        const status = getStatus(food);
        const date = new Date(food.expiryDate + "T00:00:00")
            .toLocaleDateString("no-NO");

        return `
            <article class="food-item">
                <div class="food-emoji">${getEmoji(food.category)}</div>
                <div class="food-details">
                    <h4>${escapeHTML(food.name)}</h4>
                    <p>${escapeHTML(food.category)} · Utløpsdato: ${date}</p>
                </div>
                <div class="food-actions">
                    <span class="status ${status.className}">${status.label}</span>
                    <button class="small-button" data-action="used" data-id="${food.id}">
                        Brukt opp
                    </button>
                    <button class="small-button delete-button" data-action="delete" data-id="${food.id}">
                        Slett
                    </button>
                </div>
            </article>
        `;
    }).join("");
}

function renderRecipes() {
    const availableFoods = foods.map(food => food.name.toLowerCase());

    const matches = recipes.map(recipe => {
        const matchedFoods = foods.filter(food =>
            recipe.ingredients.some(ingredient =>
                food.name.toLowerCase().includes(ingredient.toLowerCase())
            )
        );

        const urgentMatches = matchedFoods.filter(food => {
            const days = getDaysLeft(food.expiryDate);
            return days >= 0 && days <= 3;
        });

        return {
            ...recipe,
            matchedFoods,
            urgentMatches
        };
    }).filter(recipe => recipe.matchedFoods.length > 0)
      .sort((a, b) =>
          b.urgentMatches.length - a.urgentMatches.length ||
          b.matchedFoods.length - a.matchedFoods.length
      );

    if (foods.length === 0 || matches.length === 0) {
        recipeList.innerHTML = `
            <p class="empty-recipes">
                ${foods.length === 0
                    ? "Legg til matvarer for å få oppskriftsforslag."
                    : "Ingen oppskrifter passer til matvarene dine ennå. Prøv å legge til egg, melk, ost eller frukt."}
            </p>
        `;
        return;
    }

    recipeList.innerHTML = matches.map(recipe => `
        <article class="recipe-card">
            <span class="recipe-match">
                ${recipe.urgentMatches.length > 0
                    ? "⏰ Bruk snart-utløpende varer"
                    : `${recipe.matchedFoods.length} treff i kjøleskapet`}
            </span>
            <h3>🍽️ ${recipe.name}</h3>
            <p><strong>Ingredienser:</strong> ${recipe.displayIngredients}</p>
            <p><strong>Du har:</strong> ${recipe.matchedFoods.map(food => escapeHTML(food.name)).join(", ")}</p>
            <details>
                <summary>Se hvordan du lager retten</summary>
                <p>${recipe.instructions}</p>
            </details>
        </article>
    `).join("");
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

foodForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = foodNameInput.value.trim();
    const category = foodCategoryInput.value;
    const expiryDate = foodDateInput.value;

    if (!name || !expiryDate) {
        showToast("Fyll inn navn og utløpsdato.");
        return;
    }

    if (getDaysLeft(expiryDate) < 0) {
        const confirmExpired = confirm(
            "Denne datoen er allerede passert. Vil du legge til varen likevel?"
        );

        if (!confirmExpired) return;
    }

    foods.push({
        id: crypto.randomUUID(),
        name,
        category,
        expiryDate
    });

    saveFoods();
    renderFoods();
    renderRecipes();
    foodForm.reset();

    showToast(`${name} ble lagt til!`);
});

foodList.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const id = button.dataset.id;
    const food = foods.find(item => item.id === id);
    if (!food) return;

    if (button.dataset.action === "delete") {
        if (!confirm(`Vil du slette ${food.name}?`)) return;

        foods = foods.filter(item => item.id !== id);
        saveFoods();
        renderFoods();
        renderRecipes();
        showToast(`${food.name} ble slettet.`);
    }

    if (button.dataset.action === "used") {
        foods = foods.filter(item => item.id !== id);
        usedItems++;
        saveFoods();
        renderFoods();
        renderRecipes();
        showToast(`${food.name} ble markert som brukt opp.`);
    }
});

foodFilter.addEventListener("change", renderFoods);

foodDateInput.min = new Date().toLocaleDateString("en-CA");

renderFoods();
renderRecipes();

if ("Notification" in window && Notification.permission === "granted") {
    notifyExpiringFoods();
}

function notifyExpiringFoods() {
    const expiringFoods = foods.filter(food => {
        const days = getDaysLeft(food.expiryDate);
        return days >= 0 && days <= 3;
    });

    if (expiringFoods.length > 0) {
        new Notification("FreshKeep – matvarer du bør bruke snart", {
            body: expiringFoods.map(food =>
                `${food.name}: ${getStatus(food).label}`
            ).join("\n")
        });
    }
}

function requestNotifications() {
    if (!("Notification" in window)) {
        showToast("Nettleseren din støtter ikke varsler.");
        return;
    }

    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            showToast("Varsler er aktivert!");
            notifyExpiringFoods();
        } else {
            showToast("Du har ikke gitt tillatelse til varsler.");
        }
    });
}
