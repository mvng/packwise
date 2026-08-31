from playwright.sync_api import sync_playwright
def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(record_video_dir="/home/jules/verification/isolated_video")
        page.goto("http://localhost:8080/test_escape.html")
        page.wait_for_selector('h2:has-text("Paste a List")', state="visible")

        page.screenshot(path="/home/jules/verification/isolated_modal_open.png")
        page.keyboard.press("Escape")

        page.wait_for_selector('h2:has-text("Paste a List")', state="hidden")
        page.screenshot(path="/home/jules/verification/isolated_modal_closed.png")
        browser.close()

if __name__ == "__main__":
    run()
