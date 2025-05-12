<script lang="ts" setup>
import { ElTable, ElTableColumn, ElMessage } from "element-plus";
import { ref, computed } from "vue";

// Set page title
useHead({
  title: "URL Data Dashboard",
});

// Reactive state
const url = ref("");
const loading = ref(false);
const domains = ref<string[]>([]);
const selectedDomain = ref<string | null>(null);
const syncData = ref<any>(null);
const syncLoading = ref(false);

// Validate URL format
const isValidUrl = (urlString: string): boolean => {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
};

// Fetch domains from API
const fetchData = async () => {
  if (!url.value) {
    ElMessage.error("Please enter a URL");
    return;
  }

  if (!isValidUrl(url.value)) {
    ElMessage.error("Please enter a valid URL");
    return;
  }

  loading.value = true;
  try {
    const response = await fetch(
      `https://screenshot.lattex.dev/api/scan-image-links/products-by-sitemap?url=${encodeURIComponent(
        url.value
      )}`
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();

    if (!result.data || !Array.isArray(result.data.domains)) {
      throw new Error("Invalid API response format");
    }

    domains.value = result.data.domains;

    if (domains.value.length === 0) {
      ElMessage.warning("No domains found for the provided URL");
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

// Handle sync button click
const handleSync = async (domain: string) => {
  selectedDomain.value = domain;
  syncLoading.value = true;
  syncData.value = null;

  try {
    const response = await fetch(
      `https://screenshot.lattex.dev/api/scan-image-links/?url=${encodeURIComponent(domain)}`
    );

    if (!response.ok) {
      throw new Error(`Sync API request failed with status ${response.status}`);
    }

    const result = await response.json();

    if (!result.data || !Array.isArray(result.data.requests)) {
      throw new Error("Invalid sync API response format");
    }

    syncData.value = result.data; // Store sync data, including requests and invalidLinks
    ElMessage.success(`Sync completed for ${domain}`);
  } catch (error) {
    console.error("Error syncing data:", error);
    ElMessage.error("Failed to sync data. Please try again later.");
  } finally {
    syncLoading.value = false;
  }
};

// Group requests by type
const groupedRequests = computed(() => {
  if (!syncData.value || !syncData.value.requests) return {};

  return syncData.value.requests.reduce((acc: any, request: any) => {
    const type = request.type || "UNKNOWN";
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(request);
    return acc;
  }, {});
});

// Get unique types for iteration
const requestTypes = computed(() => Object.keys(groupedRequests.value));
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- Header -->
    <header class="bg-white shadow-md">
      <div class="max-w-7xl mx-auto py-5 px-4 flex items-center justify-between">
        <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">
          URL Data Dashboard
        </h1>
      </div>
    </header>

    <!-- Main Content -->
    <main class="py-8 px-4 flex flex-col lg:flex-row gap-6">
      <!-- Sidebar -->
      <aside class="w-full lg:w-1/5 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Domains</h2>
        <div v-if="loading" class="space-y-4">
          <div v-for="i in 3" :key="i" class="flex items-center gap-4 animate-pulse">
            <div class="flex-1 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div v-else-if="domains.length === 0" class="text-gray-500 text-center py-4">
          No domains available. Please enter a URL and search.
        </div>
        <ul v-else class="space-y-2">
          <li
            v-for="domain in domains"
            :key="domain"
            class="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200"
          >
            <a
              :href="domain"
              target="_blank"
              class="text-indigo-600 hover:text-indigo-800 hover:underline font-medium truncate flex-1"
            >
              {{ domain }}
            </a>
            <button
              @click="handleSync(domain)"
              :disabled="syncLoading && selectedDomain === domain"
              class="p-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-md transition-all duration-300"
              :class="{ 'animate-pulse opacity-75': syncLoading && selectedDomain === domain }"
            >
              <span v-if="!(syncLoading && selectedDomain === domain)">Sync</span>
              <span v-else class="flex items-center gap-2">
                <svg
                  class="w-4 h-4 animate-spin"
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
                Syncing
              </span>
            </button>
          </li>
        </ul>
      </aside>

      <!-- Main Content Area -->
      <section class="w-full lg:w-4/5 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <!-- Input and Search Button -->
        <div class="mb-6 flex flex-col sm:flex-row gap-4">
          <input
            v-model="url"
            type="text"
            placeholder="Enter URL..."
            class="w-full p-3 text-base transition-all duration-300 border border-gray-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 focus:ring-opacity-50 rounded-lg shadow placeholder-gray-400 text-gray-700"
            :class="{ 'opacity-75': loading }"
            :disabled="loading"
          />
          <button
            @click="fetchData"
            :disabled="loading"
            class="w-full sm:w-auto p-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 hover:shadow-lg"
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

        <!-- Sync Data Display -->
        <div class="p-4">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Sync Data</h2>
          <div v-if="syncLoading" class="space-y-4">
            <div v-for="i in 3" :key="i" class="flex items-center gap-4 animate-pulse">
              <div class="flex-1 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div v-else class="flex flex-col lg:flex-row gap-6">
            <!-- Main Sync Data (Requests) -->
            <div class="w-full lg:w-3/4">
              <div v-if="requestTypes.length > 0" class="space-y-8">
                <div
                  v-for="type in requestTypes"
                  :key="type"
                  class="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm"
                >
                  <h3 class="text-lg font-medium text-gray-800 mb-3">{{ type }} Requests</h3>
                  <el-table
                    :data="groupedRequests[type]"
                    class="w-full rounded-lg"
                    :fit="true"
                    :row-class-name="'hover:bg-gray-100 transition-colors duration-200'"
                  >
                    <el-table-column v-if="type === 'IMAGE'" label="Preview" width="100">
                      <template #default="{ row }">
                        <a :href="row.url" target="_blank">
                          <img
                            :src="row.url"
                            alt="Image preview"
                            class="w-12 h-12 object-cover rounded-md border border-gray-200"
                            @error="($event.target as HTMLImageElement).src = 'https://via.placeholder.com/48'"
                          />
                        </a>
                      </template>
                    </el-table-column>
                    <el-table-column prop="type" label="Type" width="120" />
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
                    <el-table-column prop="isValid" label="Valid" width="100">
                      <template #default="{ row }">
                        <span :class="row.isValid ? 'text-green-600' : 'text-red-600'">
                          {{ row.isValid ? 'Yes' : 'No' }}
                        </span>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
              <div v-else class="text-gray-500 text-center py-4">
                Click a sync button to fetch data for a domain.
              </div>
            </div>

            <!-- Invalid Links -->
            <div class="w-full lg:w-1/4">
              <div
                class="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm"
              >
                <div v-if="syncData && syncData.invalidLinks && syncData.invalidLinks.length > 0">
                  <el-table
                    :data="syncData.invalidLinks"
                    class="w-full rounded-lg"
                    :fit="true"
                    :row-class-name="'hover:bg-gray-100 transition-colors duration-200'"
                  >
                    <el-table-column prop="url" label="Invalid Links" min-width="200">
                      <template #default="{ row }">
                        <a
                          :href="row"
                          target="_blank"
                          class="text-indigo-600 hover:text-indigo-800 hover:underline font-medium truncate block"
                        >
                          {{ row }}
                        </a>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                <div v-else class="text-gray-500 text-center py-4">
                  No invalid links found.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>