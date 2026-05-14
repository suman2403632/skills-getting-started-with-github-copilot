document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  const escapeAttribute = (value) => value.replace(/"/g, "&quot;");

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset activity selector
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHtml = details.participants.length
          ? `
            <div class="participants">
              <p class="participants-title">Participants:</p>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) => `
                      <li>
                        <span class="participant-email">${email}</span>
                        <button type="button" class="remove-participant" data-activity="${escapeAttribute(
                          name
                        )}" data-email="${escapeAttribute(email)}" aria-label="Remove participant">&times;</button>
                      </li>
                    `
                  )
                  .join("")}
              </ul>
            </div>
          `
          : `
            <p class="participants-title">Participants:</p>
            <p class="no-participants">No one signed up yet.</p>
          `;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);

        activityCard.querySelectorAll(".remove-participant").forEach((button) => {
          button.addEventListener("click", async () => {
            const activityName = button.dataset.activity;
            const email = button.dataset.email;

            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(
                  email
                )}`,
                {
                  method: "DELETE",
                }
              );

              const result = await response.json();

              if (response.ok) {
                showMessage(result.message, "success");
                await fetchActivities();
              } else {
                showMessage(result.detail || "Failed to remove participant", "error");
              }
            } catch (error) {
              showMessage("Failed to remove participant. Please try again.", "error");
              console.error("Error removing participant:", error);
            }
          });
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
