from playwright.sync_api import sync_playwright

def verify_assignees():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # We need a logged-in session, let's just see if we can create a trip or mock one.
        # It's better to just navigate to the dashboard and log in if it's a test environment.
        context = browser.new_context()
        page = context.new_page()

        # Try to go to localhost:3000
        page.goto("http://localhost:3000")
        page.wait_for_timeout(2000)

        # Let's take a screenshot of whatever is there
        page.screenshot(path="verification/home.png")

        browser.close()

if __name__ == "__main__":
    verify_assignees()
