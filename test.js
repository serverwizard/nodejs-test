let {assert, expect} = require('chai');
// 노드를 위한 최강의 웹스크래이핑 서비스
let puppeteer = require('puppeteer');

//입력 할 텍스트
let insert_name = "insert_" + Math.random().toString(36).substring(2, 15);
let insert_description = "insert_" + Math.random().toString(36).substring(2, 15);

//수정 할 텍스트
let modi_name = "update_" + Math.random().toString(36).substring(2, 15);
let modi_description = "update_" + Math.random().toString(36).substring(2, 15);

before(async () => {

    /**
     * let 선언 안하고 변수명을 바로 쓰면, window 객체에 붙어버린다.
     * 따라서 window.browser = browser 동일하다
     */
    // browser = await puppeteer.launch({headless: false});  // 웹브라우저를 눈으로 보기위해 headless false로 설정
    browser = await puppeteer.launch(); // 브라우저 열기
    page = await browser.newPage();

    // 여기서 Models 가져옴, 그런다음 네이버 같은데서 데이터 조회해와서 바로 insert 해버리면 동적인 크롤링 가능

    // 사이트에서 뜨는 alert 및 confirm을 무조건 yes로 클릭해줌
    page.on("dialog", (dialog) => {
        dialog.accept();
    });
});

// 웹브라우저를 띄워서, 내가 원하는 작업을 하도록 코딩함
// 이를 이용해서 자동으로 네이버, 인스타에 글을 작성할 수 있음 (활용방법은 무궁무진)
describe('CRUD체크', () => {
    it('웹사이트 로딩', async () => {
        const response = await page.goto('http://localhost:3000/', {timeout: 0, waitUntil: 'domcontentloaded'});
        assert.strictEqual(response.status(), 200, "웹사이트 응답 없음");
    });

    it('작성하기 버튼 클릭', async () => {
        expect(await page.$('.btn-default'), " 버튼 btn-default 없음").to.not.null;
        await page.click('.btn-default');
        // 원하는 HTML 페이지가 로딩될 때까지 기다림, 여기선 '작성하기' 버튼이 그려질 때까지 기다림 (중요한 부분)
        // 왜냐하면 '작성하기' 버튼이 HTML 페이지 제일 하단에 있으므로
        await page.waitForSelector('.btn-primary');
    }).timeout(5000); // timeout 시간을 넉넉히 설정안하면, 디폴트 시간이 너무 짧기 때문에, 그 시간동안 페이지가 안넘어가면 에러남 (중요한 부분)

    it('글 작성하기', async () => {
        expect(await page.$('.btn-primary'), " 버튼 btn-primary 없음").to.not.null;

        // input에 값을 넣어주는 행동
        await page.evaluate((a, b) => {
            document.querySelector('input[name=name]').value = a;
            document.querySelector('textarea[name=description]').value = b;
            document.querySelector('.btn-primary').click();
        }, insert_name, insert_description);
    }).timeout(5000);

    it('작성한 텍스트 맞는지 확인', async () => {
        await page.waitForSelector('.btn-default');
        const tdName = await page.$eval('table tr:nth-child(2) td:nth-child(1) a', td => td.textContent.trim());
        const tdDescription = await page.$eval('table tr:nth-child(2) td:nth-child(2)', td => td.textContent.trim());

        assert.equal(tdName, insert_name, '제목이 일치하지 않음');
        assert.equal(tdDescription, insert_description, '내용이 일치하지 않음');
    });

    it('상세페이지 클릭', async () => {
        expect(await page.$('table tr:nth-child(2) td:nth-child(1) a'), "상세피이지 링크가 없음").to.not.null;
        await page.click('table tr:nth-child(2) td:nth-child(1) a');
    }).timeout(5000);

    it('수정하기 클릭', async () => {
        await page.waitForSelector('.btn-primary');
        expect(await page.$('.btn-primary'), " 수정버튼 btn-primary 없음").to.not.null;
        await page.click('.btn-primary');
        await page.waitForSelector('.btn-primary');
    }).timeout(5000);

    it('글 수정하기', async () => {
        await page.waitForSelector('.btn-primary');
        await page.evaluate((a, b) => {
            document.querySelector('input[name=name]').value = a;
            document.querySelector('textarea[name=description]').value = b;
            document.querySelector('.btn-primary').click();
        }, modi_name, modi_description);
    }).timeout(5000);

    it('수정한 텍스트 맞는지 확인', async () => {
        await page.waitForSelector('.btn-default');
        const nameText = await page.$eval('.panel-heading', head => head.textContent.trim());
        const descriptionText = await page.$eval('.panel-body', body => body.textContent.trim());

        assert.equal(nameText, modi_name, '제목이 일치하지 않음');
        assert.equal(descriptionText, modi_description, '내용이 일치하지 않음');
    });

    it('글목록으로 클릭', async () => {
        expect(await page.$('.btn-default'), " 목록으로 버튼 btn-default 없음").to.not.null;
        await page.click('.btn-default');
        await page.waitForSelector('.btn-default');
    }).timeout(5000);

    it('삭제하기 버튼 클릭', async () => {
        expect(await page.$('.btn-danger'), " 삭제 btn-danger 없음").to.not.null;
        await page.click('.btn-danger');
    }).timeout(5000);

    it('삭제 되어서 row가 없는지 체크', async () => {
        await page.waitForSelector('.btn-default')
        const trCounts = await page.$$eval('table tr', trs => trs.length);
        assert.equal(trCounts, 1, '삭제가 되지 않았습니다.'); // tr이 한줄만 있다는 것은 내용물이 없다는 의미
    });
});

// 브라우저 닫기
after(async () => {
    await browser.close();
});