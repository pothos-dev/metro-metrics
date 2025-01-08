<script lang="ts">
  import type { Category, Config, POI } from "$lib/types"

  let {
    config = $bindable(),
    onSubmit,
  }: {
    config: Config
    onSubmit: () => Promise<void>
  } = $props()

  let loading = $state(false)

  function addCategory() {
    config.categories.push({
      enabled: true,
      name: "doctors",
      pois: [],
      weight: 1,
    })
  }

  function deleteCategory(category: Category) {
    config.categories = config.categories.filter((c) => c !== category)
  }

  function addPOI(category: Category) {
    category.pois.push({
      enabled: true,
      weight: 1,
      column: "amenity",
      value: "hospital",
      includePolygons: true,
      includePoints: false,
      includeLines: false,
      maxCount: 10,
      maxDistance: 1000,
    })
  }

  function deletePOI(category: Category, poi: POI) {
    category.pois = category.pois.filter((p) => p !== poi)
  }

  async function submit() {
    loading = true
    await onSubmit()
    loading = false
  }
</script>

<div class="flex min-h-full flex-col overflow-y-auto p-2">
  {#each config.categories as category}
    <div class="flex flex-col bg-base-300 p-4 shadow-sm">
      <div class="flex items-end gap-1">
        <input
          class="checkbox mb-2"
          type="checkbox"
          bind:checked={category.enabled}
        />
        <label class="flex flex-col">
          <span class="text-sm">Category</span>
          <input
            class="input input-sm input-bordered"
            type="text"
            bind:value={category.name}
          />
        </label>
        <label class="flex flex-col">
          <span class="text-sm">Weight</span>
          <input
            class="input input-sm input-bordered w-20"
            type="number"
            min={0}
            step={0.1}
            bind:value={category.weight}
          />
        </label>
        <button
          class="btn btn-error ml-auto"
          onclick={() => deleteCategory(category)}
        >
          Remove
        </button>
      </div>

      {#each category.pois as poi}
        <div class="ml-4 mt-4 flex flex-col gap-1">
          <div class="flex items-end gap-1">
            <input
              class="checkbox mb-2"
              type="checkbox"
              bind:checked={poi.enabled}
            />
            <label class="flex flex-col">
              <span class="text-sm">Table Column</span>
              <input
                class="input input-sm input-bordered"
                type="text"
                bind:value={poi.column}
              />
            </label>
            <label class="flex flex-col">
              <span class="text-sm">Value</span>
              <input
                class="input input-sm input-bordered"
                type="text"
                bind:value={poi.value}
              />
            </label>
            <label class="flex flex-col">
              <span class="text-sm">Weight</span>
              <input
                class="input input-sm input-bordered w-20"
                type="number"
                bind:value={poi.weight}
              />
            </label>
            <button
              class=" btn btn-error ml-auto"
              onclick={() => deletePOI(category, poi)}
            >
              Remove
            </button>
          </div>
          <div class="ml-7 flex flex-row gap-1">
            <label class="flex flex-col">
              <span class="text-sm">Max Count</span>
              <input
                class="input input-sm input-bordered"
                type="number"
                bind:value={poi.maxCount}
              />
            </label>
            <label class="flex flex-col">
              <span class="text-sm">Max Distance</span>
              <input
                class="input input-sm input-bordered"
                type="number"
                bind:value={poi.maxDistance}
              />
            </label>
          </div>
          <div class="ml-7 flex gap-1">
            <label class="flex items-center gap-1">
              <input
                class="checkbox"
                type="checkbox"
                bind:checked={poi.includePolygons}
              />
              <span>Polygons</span>
            </label>
            <label class="flex items-center gap-1">
              <input
                class="checkbox"
                type="checkbox"
                bind:checked={poi.includePoints}
              />
              <span>Points</span>
            </label>
            <label class="flex items-center gap-1">
              <input
                class="checkbox"
                type="checkbox"
                bind:checked={poi.includeLines}
              />
              <span>Lines</span>
            </label>
          </div>
        </div>
      {/each}
      <button
        class="btn btn-success btn-wide mt-4"
        onclick={() => addPOI(category)}
      >
        Add Element
      </button>
    </div>
  {/each}

  <button class="btn btn-success btn-wide" onclick={addCategory}>
    Add Category
  </button>

  <button class="btn mt-auto" class:loading onclick={submit}> Refetch </button>
</div>
