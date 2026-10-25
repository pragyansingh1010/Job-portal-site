/* =========================================================
   CAREERCONNECT - FRONTEND JAVASCRIPT
   Features: Job Search, Filters, Saved Jobs, Authentication,
   Profile, Employer Dashboard, Form Validation, Notifications
   Storage: LocalStorage
   ========================================================= */

(() => {
    "use strict";

    // =====================================================
    // 1. CONSTANTS AND HELPER FUNCTIONS
    // =====================================================

    const K = {
        users: "cc_users",
        session: "cc_session",
        saved: "cc_saved",
        apps: "cc_apps",
        messages: "cc_messages",
        employerJobs: "cc_employer_jobs"
    };

    const $ = (selector, root = document) =>
        root.querySelector(selector);

    const $$ = (selector, root = document) =>
        [...root.querySelectorAll(selector)];

    const norm = value =>
        String(value || "").trim().toLowerCase();

    const esc = value =>
        String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);

    function read(key, defaultValue = []) {
        return Promise.resolve().then(() => {
            const value = localStorage.getItem(key);

            return value === null
                ? defaultValue
                : JSON.parse(value);
        }).catch(() => defaultValue);
    }

    function write(key, value) {
        return Promise.resolve().then(() => {
            localStorage.setItem(key, JSON.stringify(value));
            return value;
        });
    }

    function wait(ms = 250) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // =====================================================
    // 2. TOAST NOTIFICATIONS
    // =====================================================

    function toast(message, error = false) {
        let element = $("#cc-toast");

        if (!element) {
            element = document.createElement("div");
            element.id = "cc-toast";

            element.setAttribute("role", "status");
            element.setAttribute("aria-live", "polite");

            Object.assign(element.style, {
                position: "fixed",
                right: "20px",
                bottom: "20px",
                zIndex: 99999,
                maxWidth: "min(420px, calc(100vw - 40px))",
                padding: "14px 18px",
                borderRadius: "12px",
                color: "#fff",
                boxShadow: "0 12px 35px #0003",
                fontSize: "14px",
                transition: "opacity .2s"
            });

            document.body.appendChild(element);
        }

        element.style.background = error ? "#b42318" : "#166534";
        element.textContent = message;
        element.style.opacity = "1";

        clearTimeout(element.timer);

        element.timer = setTimeout(() => {
            element.style.opacity = "0";
        }, 3500);
    }

    // =====================================================
    // 3. JOB INFORMATION AND BOOKMARKS
    // =====================================================

    function info(card) {
        const heading = $("h3", card);

        const paragraph =
            card.querySelector("p strong") ||
            card.querySelectorAll("p")[0];

        const title = heading
            ? heading.textContent.trim()
            : "Job";

        const company = paragraph
            ? paragraph.textContent.trim().split("·")[0].trim()
            : "";

        return {
            key: norm(title) + "::" + norm(company),
            title,
            company,
            href: card.querySelector(
                'a[href*="apply/"], a[href*="jobs/"]'
            )?.getAttribute("href") || "jobs.html"
        };
    }

    function setSave(button, saved) {
        const iconElement = $("i", button);

        button.setAttribute("aria-pressed", String(saved));

        button.title = saved
            ? "Remove saved job"
            : "Save job";

        button.setAttribute("aria-label", button.title);

        if (iconElement) {
            iconElement.classList.toggle("fa-solid", saved);
            iconElement.classList.toggle("fa-regular", !saved);
        }
    }

    function initSaves() {
        const buttons = $$(".save-btn");
        let saved = [];

        try {
            const stored = localStorage.getItem(K.saved);

            saved = stored ? JSON.parse(stored) : [];

            if (!Array.isArray(saved)) {
                saved = [];
            }
        } catch (error) {
            saved = [];

            toast(
                "Saved jobs could not be read from this browser.",
                true
            );
        }

        buttons.forEach(button => {
            const card = button.closest(".job-card, .wide-job");

            if (!card) return;

            const item = info(card);

            setSave(
                button,
                saved.some(job => job.key === item.key)
            );

            button.addEventListener("click", () => {
                try {
                    const stored = localStorage.getItem(K.saved);

                    const current = stored
                        ? JSON.parse(stored)
                        : [];

                    const list = Array.isArray(current)
                        ? current
                        : [];

                    const exists = list.some(
                        job => job.key === item.key
                    );

                    const next = exists
                        ? list.filter(job => job.key !== item.key)
                        : [...list, item];

                    localStorage.setItem(
                        K.saved,
                        JSON.stringify(next)
                    );

                    setSave(button, !exists);

                    toast(
                        exists
                            ? "Removed saved job."
                            : "Job saved. It will remain saved after you refresh."
                    );

                    renderProfile();
                } catch (error) {
                    toast(
                        "Could not save this job. Check that browser storage is enabled.",
                        true
                    );
                }
            });
        });
    }

    // =====================================================
    // 4. HOME PAGE SEARCH
    // =====================================================

    function initHome() {
        const form = $(".search-box");

        if (!form) return;

        form.addEventListener("submit", event => {
            event.preventDefault();

            const data = new FormData(form);
            const params = new URLSearchParams();

            ["query", "location", "category"].forEach(key => {
                const value = String(data.get(key) || "").trim();

                if (value) {
                    params.set(key, value);
                }
            });

            location.href = "jobs.html" +
                (params.toString() ? "?" + params : "");
        });
    }

    // =====================================================
    // 5. SAMPLE JOB DATA
    // =====================================================

    const extraJobs = [
        [
            "Product Designer", "Figma", "Remote", "Full-time",
            "Design",
            "Design intuitive workflows and polished product experiences.",
            "$110k – $150k", "3–5 yrs",
            "Figma, UX Research, Prototyping"
        ],
        [
            "Data Scientist", "Netflix", "Los Gatos, CA", "Hybrid",
            "Analytics",
            "Build models and translate complex datasets into useful insights.",
            "$130k – $180k", "3–6 yrs",
            "Python, SQL, Machine Learning"
        ],
        [
            "DevOps Engineer", "Atlassian", "Bengaluru, India", "Remote",
            "Cloud Computing",
            "Improve CI/CD pipelines, reliability, and developer tooling.",
            "₹18L – ₹32L", "3–5 yrs",
            "Docker, Kubernetes, CI/CD"
        ],
        [
            "Security Engineer", "Cisco", "Austin, TX", "Full-time",
            "Cybersecurity",
            "Strengthen systems through security reviews and threat analysis.",
            "$120k – $165k", "3–6 yrs",
            "SIEM, Risk, Networking"
        ],
        [
            "Mobile App Developer", "Uber", "Hyderabad, India", "Hybrid",
            "Technology",
            "Build smooth mobile experiences for customers and partners.",
            "₹16L – ₹28L", "2–5 yrs",
            "Android, Kotlin, APIs"
        ],
        [
            "Business Analyst", "Deloitte", "New York, NY", "Full-time",
            "Analytics",
            "Work with stakeholders to define requirements and measure outcomes.",
            "$85k – $120k", "2–4 yrs",
            "SQL, Reporting, Excel"
        ],
        [
            "Machine Learning Engineer", "NVIDIA", "Santa Clara, CA",
            "Full-time", "Artificial Intelligence",
            "Deploy scalable ML systems and optimize model performance.",
            "$150k – $220k", "4–7 yrs",
            "Python, ML, PyTorch"
        ],
        [
            "Cloud Architect", "Oracle", "Remote", "Remote",
            "Cloud Computing",
            "Design secure cloud architecture for enterprise workloads.",
            "$145k – $195k", "5–8 yrs",
            "AWS, Azure, Architecture"
        ],
        [
            "Graphic Designer", "Canva", "Sydney, Australia", "Hybrid",
            "Design",
            "Create clear visual assets for campaigns and product launches.",
            "A$80k – A$115k", "2–4 yrs",
            "Illustrator, Branding, Layout"
        ],
        [
            "QA Automation Engineer", "TCS", "Pune, India", "Full-time",
            "Technology",
            "Build automated tests and improve release confidence.",
            "₹9L – ₹17L", "2–5 yrs",
            "Selenium, Java, Testing"
        ],
        [
            "Frontend Engineer", "Shopify", "Remote", "Remote",
            "Technology",
            "Create accessible, responsive storefront experiences.",
            "$115k – $160k", "3–5 yrs",
            "React, TypeScript, CSS"
        ],
        [
            "Database Administrator", "IBM", "Raleigh, NC", "Full-time",
            "Cloud Computing",
            "Maintain database performance, backups, and availability.",
            "$95k – $135k", "3–6 yrs",
            "SQL, PostgreSQL, Backup"
        ],
        [
            "Digital Marketing Specialist", "HubSpot", "Boston, MA",
            "Hybrid", "Marketing",
            "Plan campaigns and optimize acquisition across digital channels.",
            "$70k – $100k", "2–4 yrs",
            "SEO, Analytics, Campaigns"
        ],
        [
            "HR Coordinator", "Adobe", "San Jose, CA", "Full-time",
            "Human Resources",
            "Support recruitment coordination and employee programs.",
            "$60k – $82k", "1–3 yrs",
            "Recruiting, HRIS, Communication"
        ],
        [
            "Technical Writer", "GitLab", "Remote", "Remote",
            "Technology",
            "Document developer workflows and technical product features.",
            "$90k – $125k", "2–5 yrs",
            "Documentation, APIs, Markdown"
        ],
        [
            "Financial Analyst", "JPMorgan Chase", "Mumbai, India",
            "Hybrid", "Finance",
            "Prepare forecasts, evaluate performance, and explain variances.",
            "₹12L – ₹22L", "2–5 yrs",
            "Excel, Modeling, Reporting"
        ],
        [
            "Research Scientist", "OpenAI", "San Francisco, CA",
            "Full-time", "Artificial Intelligence",
            "Explore model capabilities and evaluate new research directions.",
            "$180k – $280k", "PhD / equivalent",
            "Research, Python, ML"
        ],
        [
            "Network Engineer", "Juniper Networks", "Denver, CO",
            "Full-time", "Technology",
            "Operate and troubleshoot enterprise network infrastructure.",
            "$100k – $145k", "3–6 yrs",
            "TCP/IP, Routing, Security"
        ],
        [
            "Content Strategist", "Notion", "Remote", "Remote",
            "Marketing",
            "Shape product storytelling and create useful content programs.",
            "$95k – $130k", "3–5 yrs",
            "Writing, SEO, Strategy"
        ],
        [
            "UX Researcher", "Airbnb", "Seattle, WA", "Hybrid",
            "Design",
            "Run user studies and turn findings into product recommendations.",
            "$120k – $165k", "3–6 yrs",
            "Interviews, Research, UX"
        ],
        [
            "Full Stack Developer", "Walmart Global Tech",
            "Bengaluru, India", "Hybrid", "Technology",
            "Deliver frontend and backend features for high-traffic services.",
            "₹18L – ₹30L", "3–6 yrs",
            "JavaScript, APIs, SQL"
        ],
        [
            "Operations Analyst", "Flipkart", "Bengaluru, India",
            "Full-time", "Analytics",
            "Use operational data to identify bottlenecks and improvements.",
            "₹8L – ₹15L", "1–4 yrs",
            "Excel, SQL, Dashboards"
        ],
        [
            "IT Support Specialist", "Dell", "Chennai, India",
            "Full-time", "Technology",
            "Troubleshoot hardware, software, and user access issues.",
            "₹5L – ₹9L", "1–3 yrs",
            "Windows, Networking, Support"
        ],
        [
            "Product Manager", "Spotify", "Stockholm, Sweden", "Hybrid",
            "Technology",
            "Set product priorities and align engineering and design teams.",
            "€90k – €130k", "4–7 yrs",
            "Roadmaps, Metrics, Agile"
        ],
        [
            "AI Research Intern", "Amazon", "Seattle, WA", "Internship",
            "Artificial Intelligence",
            "Assist with experiments and prototypes for applied AI projects.",
            "$35 – $55/hr", "Currently studying",
            "Python, ML, Research"
        ],
        [
            "Recruiter", "LinkedIn", "Gurugram, India", "Full-time",
            "Human Resources",
            "Partner with hiring teams and guide candidates through hiring.",
            "₹10L – ₹18L", "2–5 yrs",
            "Sourcing, Interviews, ATS"
        ],
        [
            "Video Editor", "YouTube", "Remote", "Contract",
            "Design",
            "Edit engaging short- and long-form video content.",
            "$35 – $60/hr", "2–4 yrs",
            "Premiere Pro, Storytelling, Motion"
        ],
        [
            "Sales Development Representative", "Salesforce", "Chicago, IL",
            "Full-time", "Sales",
            "Build pipeline through outreach and thoughtful customer discovery.",
            "$65k – $95k", "1–3 yrs",
            "CRM, Outreach, Communication"
        ],
        [
            "Research Data Analyst", "WHO", "Geneva, Switzerland",
            "Contract", "Analytics",
            "Clean and analyze research datasets for evidence-based reports.",
            "CHF 70k – CHF 95k", "2–5 yrs",
            "Statistics, R, SQL"
        ],
        [
            "Technical Program Manager", "Microsoft", "Redmond, WA",
            "Full-time", "Technology",
            "Coordinate cross-functional engineering programs and delivery risks.",
            "$135k – $185k", "5–8 yrs",
            "Planning, Agile, Cloud"
        ]
    ];

    // =====================================================
    // 6. ADD SAMPLE JOBS TO THE JOBS PAGE
    // =====================================================

    function addExtraJobs(list) {
        if (!list || list.querySelector("[data-extra-jobs]")) {
            return;
        }

        const wrapper = document.createElement("div");

        wrapper.setAttribute("data-extra-jobs", "true");

        extraJobs.forEach(job => {
            const [
                title,
                company,
                jobLocation,
                type,
                industry,
                description,
                salary,
                experience,
                tags
            ] = job;

            const card = document.createElement("article");

            card.className = "wide-job";
            card.dataset.industry = industry;
            card.dataset.jobType = type;

            card.innerHTML = `
                <div>
                    <div class="logo-box">
                        ${esc(company.slice(0, 1))}
                    </div>
                </div>

                <div>
                    <h3>${esc(title)}</h3>

                    <p>
                        <strong>${esc(company)}</strong>
                        · ${esc(jobLocation)}
                    </p>

                    <div class="meta">
                        <span>
                            <i class="fa-solid fa-money-bill-wave"></i>
                            ${esc(salary)}
                        </span>

                        <span>
                            <i class="fa-solid fa-briefcase"></i>
                            ${esc(experience)}
                        </span>

                        <span>
                            <i class="fa-solid fa-house"></i>
                            ${esc(type)}
                        </span>
                    </div>

                    <p class="description">
                        ${esc(description)}
                    </p>

                    <div class="tags">
                        ${tags.split(", ").map(tag => `
                            <span class="tag">${esc(tag)}</span>
                        `).join("")}
                    </div>
                </div>

                <div class="card-footer">
                    <button
                        class="icon-btn save-btn"
                        type="button"
                        aria-label="Save job"
                        aria-pressed="false"
                    >
                        <i class="fa-regular fa-bookmark"></i>
                    </button>

                    <a class="btn btn-primary" href="login.html">
                        Apply
                    </a>
                </div>
            `;

            wrapper.appendChild(card);
        });

        list.appendChild(wrapper);
    }

    // =====================================================
    // 7. JOB FILTERING, SEARCH AND SORTING
    // =====================================================

    function initFilters() {
        const panel = $(".filter-panel");
        const list = $(".jobs-list");

        if (!panel || !list) return;

        addExtraJobs(list);

        const cards = $$(".wide-job", list);

        if (!cards.length) return;

        const fields = $$("input, select", panel);

        const [search, loc, type, industry] = fields;

        const button = $("button", panel);
        const sort = $(".toolbar select");
        const count = $(".toolbar span");

        const params = new URLSearchParams(location.search);

        if (search && params.has("query")) {
            search.value = params.get("query");
        }

        if (loc && params.has("location")) {
            loc.value = params.get("location");
        }

        if (industry && params.has("category")) {
            const option = $$("option", industry).find(item =>
                norm(item.value || item.textContent) ===
                norm(params.get("category"))
            );

            if (option) {
                industry.value = option.value || option.textContent;
            }
        }

        function cardData(card) {
            const title = $("h3", card)?.textContent.trim() || "";

            const company =
                card.querySelector("p strong")?.textContent.trim() || "";

            const paragraphs = $$("p", card)
                .map(paragraph => paragraph.textContent.trim())
                .join(" ");

            const meta = $$(".meta span", card)
                .map(element => element.textContent.trim());

            const tags = $$(".tags .tag", card)
                .map(element => element.textContent.trim());

            const jobType =
                card.dataset.jobType ||
                (meta.length ? meta[meta.length - 1] : "");

            const text = norm([
                title,
                company,
                paragraphs,
                ...meta,
                ...tags
            ].join(" "));

            const categoryText = norm([
                title,
                paragraphs,
                ...tags,
                card.dataset.industry || ""
            ].join(" "));

            const categories = [];

            if (/analyst|analytics|sql|tableau|data/.test(categoryText)) {
                categories.push("analytics");
            }

            if (/ai engineer|artificial intelligence|machine learning|\bml\b|python/.test(categoryText)) {
                categories.push("artificial intelligence");
            }

            if (/cloud|aws|azure|kubernetes|terraform/.test(categoryText)) {
                categories.push("cloud computing");
            }

            if (/cyber|security|siem|risk/.test(categoryText)) {
                categories.push("cybersecurity");
            }

            if (/designer|design|figma|ux|ui/.test(categoryText)) {
                categories.push("design");
            }

            if (/developer|engineer|software|react|node\.js|typescript|api/.test(categoryText)) {
                categories.push("technology");
            }

            return {
                title,
                company,
                text,
                categoryText,
                jobType: norm(jobType),
                categories
            };
        }

        function filter() {
            let visible = 0;

            cards.forEach(card => {
                const data = cardData(card);

                const query = norm(search?.value);
                const where = norm(loc?.value);
                const selectedType = norm(type?.value);
                const selectedIndustry = norm(industry?.value);

                const matchesSearch =
                    !query ||
                    data.categoryText.includes(query) ||
                    norm(data.company).includes(query);

                const matchesLocation =
                    !where || data.text.includes(where);

                const matchesType =
                    !selectedType ||
                    data.jobType.includes(selectedType);

                const matchesIndustry =
                    !selectedIndustry ||
                    norm(card.dataset.industry) === selectedIndustry ||
                    data.categories.some(
                        category => category === selectedIndustry
                    ) ||
                    data.categoryText.includes(selectedIndustry);

                const show =
                    matchesSearch &&
                    matchesLocation &&
                    matchesType &&
                    matchesIndustry;

                card.hidden = !show;
                card.style.display = show ? "" : "none";

                if (show) {
                    visible++;
                }
            });

            if (count) {
                count.textContent =
                    "Showing " + visible +
                    " job" + (visible === 1 ? "" : "s");
            }

            let empty = $("#cc-empty-jobs");

            if (!visible && !empty) {
                empty = document.createElement("p");
                empty.id = "cc-empty-jobs";
                empty.className = "description";

                empty.textContent =
                    "No jobs match those filters. Try changing your search.";

                list.appendChild(empty);
            }

            if (empty) {
                empty.hidden = visible > 0;
            }
        }

        button?.addEventListener("click", event => {
            event.preventDefault();
            filter();
        });

        fields.forEach(field => {
            field.addEventListener("keydown", event => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    filter();
                }
            });
        });

        sort?.addEventListener("change", () => {
            const mode = norm(sort.value);
            const ordered = [...cards];

            if (mode.includes("title")) {
                ordered.sort((a, b) =>
                    info(a).title.localeCompare(info(b).title)
                );
            } else if (mode.includes("company")) {
                ordered.sort((a, b) =>
                    info(a).company.localeCompare(info(b).company)
                );
            }

            ordered.forEach(card => list.appendChild(card));

            filter();
        });

        filter();
    }

    // =====================================================
    // 8. FORM VALIDATION
    // =====================================================

    function validate(form) {
        for (const element of $$("input, select, textarea", form)) {
            if (
                ["file", "submit", "button"].includes(element.type) ||
                element.disabled
            ) {
                continue;
            }

            if (element.type === "checkbox") {
                const label = element.closest("label")?.textContent || "";

                if (/terms|accept/i.test(label) && !element.checked) {
                    throw Error(
                        "Please accept the Terms and Privacy Policy."
                    );
                }

                continue;
            }

            const value = element.value.trim();

            const label =
                element.closest("div")?.querySelector("label")
                    ?.textContent.trim() ||
                element.placeholder ||
                "field";

            if (!value) {
                throw Error("Please complete the " + label + " field.");
            }

            if (
                element.type === "email" &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
            ) {
                throw Error("Please enter a valid email address.");
            }
        }
    }

    function fields(form) {
        return $$("input, select, textarea", form).filter(element =>
            !["checkbox", "file", "submit", "button"].includes(element.type)
        );
    }

    // =====================================================
    // 9. LOGIN AND REGISTRATION
    // =====================================================

    function initAuth() {
        const form = $(".auth-card form");
        const path = location.pathname.toLowerCase();

        if (
            !form ||
            (!path.endsWith("login.html") &&
             !path.endsWith("register.html"))
        ) {
            return;
        }

        const isRegister = path.endsWith("register.html");

        form.addEventListener("submit", event => {
            event.preventDefault();

            Promise.resolve()
                .then(() => {
                    validate(form);

                    const formFields = fields(form);

                    const passwords = formFields.filter(
                        element => element.type === "password"
                    );

                    if (isRegister) {
                        if ((passwords[0]?.value || "").length < 8) {
                            throw Error(
                                "Use a password with at least 8 characters."
                            );
                        }

                        if (
                            passwords[0]?.value !== passwords[1]?.value
                        ) {
                            throw Error("Passwords do not match.");
                        }

                        if (!$("select", form)?.value) {
                            throw Error("Please select a role.");
                        }

                        return (
                            "Registration form validated. " +
                            "Account creation will be added in Section 3."
                        );
                    }

                    return (
                        "Login form validated. " +
                        "Real sign-in will be added in Section 3."
                    );
                })
                .then(message => toast(message))
                .catch(error => {
                    toast(
                        error.message || "Please check your details.",
                        true
                    );
                });
        });
    }

    // =====================================================
    // 10. JOB APPLICATION FORM
    // =====================================================

    function initApply() {
        if (!/\/apply\/[^/]+\.html$/i.test(location.pathname)) {
            return;
        }

        const form = $("main form.form-grid");

        if (!form) return;

        form.addEventListener("submit", event => {
            event.preventDefault();

            Promise.resolve()
                .then(() => {
                    validate(form);

                    return (
                        "Application form validated. " +
                        "Sending applications is part of Section 3."
                    );
                })
                .then(message => toast(message))
                .catch(error => {
                    toast(
                        error.message || "Please check your details.",
                        true
                    );
                });
        });
    }

    // =====================================================
    // 11. CONTACT FORM
    // =====================================================

    function initContact() {
        if (!/contact\.html$/i.test(location.pathname)) {
            return;
        }

        const form = $("main form.form-grid");

        if (!form) return;

        form.addEventListener("submit", event => {
            event.preventDefault();

            Promise.resolve()
                .then(() => {
                    validate(form);

                    return (
                        "Contact form validated. " +
                        "Message delivery is part of Section 3."
                    );
                })
                .then(message => toast(message))
                .catch(error => {
                    toast(
                        error.message || "Please check your details.",
                        true
                    );
                });
        });
    }

    // =====================================================
    // 12. HEADER AND SESSION
    // =====================================================

    function initHeader() {
        read(K.session, null).then(session => {
            if (!session) return;

            const login = $(".nav-signin");
            const register = $(".nav-register");

            if (login) {
                login.textContent = "My Profile";

                login.href = session.role === "Employer"
                    ? "employer.html"
                    : "profile.html";
            }

            if (register) {
                register.textContent = "Sign Out";
                register.href = "#";

                register.addEventListener("click", event => {
                    event.preventDefault();

                    write(K.session, null).then(() => {
                        location.href = "index.html";
                    });
                });
            }
        });
    }

    // =====================================================
    // 13. USER PROFILE AND APPLICATION STATISTICS
    // =====================================================

    function renderProfile() {
        if (!/profile\.html$/i.test(location.pathname)) {
            return;
        }

        Promise.all([
            read(K.session, null),
            read(K.saved, []),
            read(K.apps, [])
        ])
            .then(([session, saved, apps]) => {
                const name = session?.name || "Guest";

                const heading = $(
                    ".profile-content .section-head h2"
                );

                const navName = $(".profile-nav h3");
                const email = $(".profile-nav small");

                if (heading) {
                    heading.textContent =
                        "Welcome, " + name.split(/\s+/)[0];
                }

                if (navName) {
                    navName.textContent = name;
                }

                if (email && session) {
                    email.textContent = session.email;
                }

                const stats = $$(".mini-stat strong");

                if (stats[0]) {
                    stats[0].textContent = saved.length;
                }

                if (stats[1]) {
                    stats[1].textContent = apps.length;
                }

                const detail = $(".detail-section");

                if (detail) {
                    detail.innerHTML =
                        "<h3>Your applications</h3>" +
                        (
                            apps.length
                                ? apps.slice().reverse().slice(0, 8)
                                    .map(application => `
                                        <div class="wide-job"
                                             style="margin:10px 0">
                                            <div>
                                                <h3>${esc(application.title)}</h3>
                                                <p>
                                                    ${esc(
                                                        new Date(
                                                            application.submittedAt
                                                        ).toLocaleDateString()
                                                    )}
                                                </p>
                                            </div>

                                            <span class="tag">
                                                ${esc(application.status)}
                                            </span>
                                        </div>
                                    `).join("")
                                : `
                                    <p class="description">
                                        No applications saved in this browser
                                        yet. Browse jobs to get started.
                                    </p>
                                `
                        );
                }

                $$(".profile-nav a").forEach(link => {
                    const text = norm(link.textContent);

                    if (
                        text.includes("saved jobs") ||
                        text.includes("applications") ||
                        text.includes("profile settings")
                    ) {
                        link.addEventListener("click", event => {
                            event.preventDefault();

                            toast(
                                text.includes("saved jobs")
                                    ? "Saved jobs: " + saved.length
                                    : text.includes("applications")
                                        ? "Applications: " + apps.length
                                        : "Profile editing requires a backend."
                            );
                        });
                    }

                    if (text.includes("sign out")) {
                        link.addEventListener("click", event => {
                            event.preventDefault();

                            write(K.session, null).then(() => {
                                location.href = "index.html";
                            });
                        });
                    }
                });
            })
            .catch(console.error);
    }

    // =====================================================
    // 14. EMPLOYER DASHBOARD AND JOB POSTING
    // =====================================================

    function initEmployer() {
        if (
            !/employer\.html$/i.test(location.pathname) ||
            !$("main") ||
            $("#cc-employer-panel")
        ) {
            return;
        }

        const section = document.createElement("section");

        section.id = "cc-employer-panel";
        section.className = "section";

        section.innerHTML = `
            <div class="container">
                <h2>Post a job</h2>

                <p>
                    Create a listing stored only in this browser.
                </p>

                <form class="form-grid" id="cc-job-form">
                    <div>
                        <label for="cc-title">Job title</label>
                        <input id="cc-title" required>
                    </div>

                    <div>
                        <label for="cc-company">Company</label>
                        <input id="cc-company" required>
                    </div>

                    <div>
                        <label for="cc-location">Location</label>
                        <input id="cc-location" required>
                    </div>

                    <div>
                        <label for="cc-type">Job type</label>

                        <select id="cc-type" required>
                            <option value="">Choose type</option>
                            <option>Full-time</option>
                            <option>Part-time</option>
                            <option>Contract</option>
                            <option>Internship</option>
                            <option>Remote</option>
                        </select>
                    </div>

                    <div>
                        <label for="cc-description">Description</label>
                        <textarea id="cc-description" required></textarea>
                    </div>

                    <button class="btn btn-primary" type="submit">
                        Save job listing
                    </button>
                </form>

                <div id="cc-employer-list"></div>
            </div>
        `;

        $("main").appendChild(section);

        const form = $("#cc-job-form");
        const list = $("#cc-employer-list");

        function render() {
            read(K.employerJobs, []).then(jobs => {
                list.innerHTML = jobs.map(job => `
                    <article class="wide-job">
                        <div>
                            <h3>${esc(job.title)}</h3>

                            <p>
                                ${esc(job.company)}
                                · ${esc(job.location)}
                                · ${esc(job.type)}
                            </p>

                            <p>${esc(job.description)}</p>
                        </div>

                        <button
                            data-del="${esc(job.id)}"
                            class="btn btn-outline"
                            type="button"
                        >
                            Delete
                        </button>
                    </article>
                `).join("") || "<p>No listings created yet.</p>";
            });
        }

        form.addEventListener("submit", event => {
            event.preventDefault();

            Promise.resolve()
                .then(() => {
                    validate(form);

                    const job = {
                        id: "j" + Date.now(),
                        title: $("#cc-title").value.trim(),
                        company: $("#cc-company").value.trim(),
                        location: $("#cc-location").value.trim(),
                        type: $("#cc-type").value,
                        description: $("#cc-description").value.trim()
                    };

                    return read(K.employerJobs, []).then(jobs =>
                        write(K.employerJobs, [...jobs, job])
                    );
                })
                .then(() => {
                    form.reset();

                    toast("Job listing saved locally.");

                    render();
                })
                .catch(error => {
                    toast(error.message || "Could not save the listing.", true);
                });
        });

        list.addEventListener("click", event => {
            const button = event.target.closest("[data-del]");

            if (!button) return;

            read(K.employerJobs, [])
                .then(jobs =>
                    write(
                        K.employerJobs,
                        jobs.filter(job => job.id !== button.dataset.del)
                    )
                )
                .then(() => {
                    toast("Job listing deleted.");
                    render();
                })
                .catch(error => {
                    toast("Could not delete the listing.", true);
                });
        });

        render();
    }

    // =====================================================
    // 15. OTHER INTERACTIONS AND PAGE LOADER
    // =====================================================

    function initOther() {
        $$(".social-login button").forEach(button => {
            button.addEventListener("click", event => {
                event.preventDefault();

                toast(
                    "Social sign-in is not connected. Use email and password.",
                    true
                );
            });
        });

        $$('a[href="#"]').forEach(link => {
            if (
                link.closest(".socials") ||
                link.closest(".profile-nav")
            ) {
                return;
            }

            link.addEventListener("click", event => {
                if (norm(link.textContent).includes("forgot password")) {
                    event.preventDefault();

                    toast(
                        "Password reset requires a backend and email service."
                    );
                } else if (link.closest("footer")) {
                    event.preventDefault();

                    toast("This link is not connected yet.");
                }
            });
        });

        const loader = $(".loader-screen");

        if (loader) {
            wait(300).then(() => {
                loader.style.transition = "opacity .3s";
                loader.style.opacity = "0";

                setTimeout(() => loader.remove(), 320);
            });
        }
    }

    // =====================================================
    // 16. INITIALIZE ALL FEATURES
    // =====================================================

    function init() {
        initHome();
        initFilters();
        initSaves();
        initAuth();
        initApply();
        initContact();
        initHeader();
        renderProfile();
        initEmployer();
        initOther();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, {
            once: true
        });
    } else {
        init();
    }

})();