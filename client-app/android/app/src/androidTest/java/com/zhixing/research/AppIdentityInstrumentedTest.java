package com.zhixing.research;

import static org.junit.Assert.assertEquals;

import android.content.Context;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class AppIdentityInstrumentedTest {

    @Test
    public void targetContextUsesZhixingApplicationId() {
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();

        assertEquals("com.zhixing.research", BuildConfig.APPLICATION_ID);
        assertEquals(BuildConfig.APPLICATION_ID, appContext.getPackageName());
    }
}
