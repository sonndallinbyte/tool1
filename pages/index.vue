<script lang="ts" setup>
import {
  ElInput,
  ElButton,
  ElCard,
  ElMessage,
  ElTable,
  ElTableColumn,
} from "element-plus";
import { ref, computed } from "vue";

// Set page title
useHead({
  title: "URL Data Dashboard",
});

// Reactive state
const url = ref("");
const loading = ref(false);
interface DataItem {
  type: TypeConfigKey;
  url: string;
  isValid: boolean;
}

const data = ref<DataItem[]>([]);
// Validate URL format
const isValidUrl = (urlString: string): boolean => {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
};

// Fetch data from API
const fetchData = async (inputUrl: string) => {
  if (!inputUrl) {
    ElMessage.error("Please enter a URL");
    return;
  }

  if (!isValidUrl(inputUrl)) {
    ElMessage.error("Please enter a valid URL");
    return;
  }

  loading.value = true;
  try {
    const response = await fetch(
      `https://screenshot.lattex.dev/api/scan-image-links/?url=${encodeURIComponent(
        inputUrl
      )}`
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();

    if (!result.data || !Array.isArray(result.data)) {
      throw new Error("Invalid API response format");
    }

    data.value = result.data;

    if (data.value.length === 0) {
      ElMessage.warning("No data found for the provided URL");
    } else {
      ElMessage.success("Data fetched successfully");
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    ElMessage.error("Failed to fetch data. Please try again later.");
  } finally {
    loading.value = false;
  }
};

// Map type to icon and title
type TypeConfigKey = "IMAGE" | "JS" | "CSS" | "OTHER" | "API";
interface TypeConfigValue {
  icon: string;
  title: string;
}
const typeConfig: Record<TypeConfigKey, TypeConfigValue> = {
  IMAGE: { icon: "📸", title: "Image Data" },
  JS: { icon: "📜", title: "JavaScript Data" },
  CSS: { icon: "🎨", title: "CSS Data" },
  OTHER: { icon: "📁", title: "Other Data" },
  API: { icon: "🌐", title: "API Data" },
  // Add more types if needed
};

// Get unique types from data
const uniqueTypes = computed((): TypeConfigKey[] => {
  return [
    ...new Set(data.value.map((item: DataItem) => item.type)),
  ] as TypeConfigKey[];
});

const groupedData = computed((): Record<TypeConfigKey, DataItem[]> => {
  const groups: Partial<Record<TypeConfigKey, DataItem[]>> = {};
  data.value.forEach((item: DataItem) => {
    if (!groups[item.type]) {
      groups[item.type] = [];
    }
    groups[item.type]!.push(item);
  });
  return groups as Record<TypeConfigKey, DataItem[]>;
});

// Handle image load error
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = "https://via.placeholder.com/64?text=No+Image";
  img.alt = "Image not available";
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-md">
      <div
        class="max-w-7xl mx-auto py-5 px-4 sm:px-6 lg:px-8 flex items-center justify-between"
      >
        <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">
          URL Data Dashboard
        </h1>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Input and Search Button -->
      <div class="mb-10 flex flex-col sm:flex-row gap-4 relative">
        <div class="w-full">
          <input
            v-model="url"
            type="text"
            placeholder="Enter URL ..."
            class="w-full p-3 text-base transition-all duration-300 border border-gray-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 focus:ring-opacity-50 rounded-lg shadow placeholder-gray-400 text-gray-700"
            :class="{ 'opacity-75': loading }"
            :disabled="loading"
          />
        </div>

        <button
          @click="fetchData(url)"
          :disabled="loading"
          class="w-full p-3 sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 hover:shadow-lg"
          :class="{ 'animate-pulse opacity-75': loading }"
        >
          <span v-if="!loading">Search</span>
          <span v-else class="flex items-center gap-2">
            <svg
              class="w-5 h-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading
          </span>
        </button>
      </div>

      <!-- Dynamic Sections -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <el-card
          v-for="type in uniqueTypes"
          :key="type"
          shadow="hover"
          class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-200"
        >
          <div class="p-6">
            <h2
              class="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2"
            >
              <span class="text-indigo-600">{{
                typeConfig[type]?.icon || "📌"
              }}</span>
              {{ typeConfig[type]?.title || `${type} Data` }}
            </h2>
            <p class="text-sm text-gray-500 mb-4">
              Total: {{ groupedData[type]?.length || 0 }} items
            </p>
            <div class="max-h-96 overflow-y-auto">
              <el-table
                :data="groupedData[type] || []"
                class="w-full rounded-lg"
                max-height="400"
                v-if="groupedData[type]?.length > 0 && !loading"
                :row-class-name="'hover:bg-gray-50 transition-colors duration-200'"
              >
                <!-- Preview Column (only for IMAGE type) -->
                <el-table-column
                  v-if="type === 'IMAGE'"
                  label="Preview"
                  width="120"
                >
                  <template #default="{ row }">
                    <img
                      :src="row.url"
                      alt="Image Preview"
                      class="w-16 h-16 object-contain rounded-md border border-gray-200 hover:scale-110 transition-transform duration-200"
                      @error="handleImageError"
                      loading="lazy"
                    />
                  </template>
                </el-table-column>
                <!-- URL Column -->
                <el-table-column prop="url" label="URL" min-width="300">
                  <template #default="{ row }">
                    <a
                      :href="row.url"
                      target="_blank"
                      class="text-indigo-600 hover:text-indigo-800 hover:underline font-medium truncate block"
                    >
                      {{ row.url }}
                    </a>
                  </template>
                </el-table-column>
                <!-- Valid Column -->
                <el-table-column prop="isValid" label="Valid" width="100">
                  <template #default="{ row }">
                    <span
                      :class="[
                        row.isValid
                          ? 'text-green-600 bg-green-100'
                          : 'text-red-600 bg-red-100',
                        'font-semibold px-2 py-1 rounded-full bg-opacity-10',
                      ]"
                    >
                      {{ row.isValid ? "True" : "False" }}
                    </span>
                  </template>
                </el-table-column>
              </el-table>
              <div v-else-if="loading" class="space-y-4">
                <!-- Skeleton Loader -->
                <div
                  v-for="i in 3"
                  :key="i"
                  class="flex items-center gap-4 animate-pulse"
                >
                  <div
                    v-if="type === 'IMAGE'"
                    class="w-16 h-16 bg-gray-200 rounded-md"
                  ></div>
                  <div class="flex-1 h-4 bg-gray-200 rounded"></div>
                  <div class="w-16 h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div v-else class="text-gray-500 text-center py-4">
                No {{ typeConfig[type]?.title || type }} data available
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </main>
  </div>
</template>
