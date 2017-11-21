let sleep = require("sleep");

const TestDelay = function ()
{
    TestDelay.testCount++;

    if ((TestDelay.testCount % TestDelay.batchSize) === 0)
    {
        TestDelay.testCount = 0;
        sleep.msleep(TestDelay.delay);
    }
};

TestDelay.delay = 5000;
TestDelay.testCount = 0;
TestDelay.batchSize = 200;

module.exports.TestDelay = TestDelay;
