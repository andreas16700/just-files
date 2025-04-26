<script>
    import {onMount} from 'svelte';
    import {login} from '$lib/stores/stores.svelte'

    let email = $state('');
    let password = $state('');

    let waiting = $state(false)
    /**
     * Selects an update item.
     * @param {MouseEvent | KeyboardEvent | SubmitEvent} event
     */
    async function btnPressed(event){
      // Animation logic (keep as is)
      if (event?.currentTarget && event.currentTarget instanceof HTMLElement) {
            const el = event.currentTarget;
            const class_name = "animate-mypulse";
            el.classList.remove(class_name);
            void el.offsetWidth;
            el.classList.add(class_name);
            setTimeout(() => {
                if (el?.classList.contains(class_name)) {
                     el.classList.remove(class_name);
                }
            }, 450);
        }
      await loginClicked()
    }

    async function loginClicked() {
      if (waiting){return}
      
      waiting=true
      await login(email, password)
      waiting=false
    }

</script>
<div class="min-h-screen flex items-center justify-center
         bg-gray-50 dark:bg-gray-800
         py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold
             text-gray-900 dark:text-gray-100">
          Sign in to your account
        </h2>
      </div>
      <form class="mt-8 space-y-6" onsubmit={(event) => btnPressed(event)}>
        <input type="hidden" name="remember" value="true">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email-address" class="sr-only">Email address</label>
            <input id="email-address" name="email" type="email" autocomplete="email" required bind:value={email} class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 dark:placeholder-gray-400
                   text-gray-900 dark:text-gray-100 rounded-t-md focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400
                   focus:border-indigo-500 dark:focus:border-indigo-400 focus:z-10 sm:text-sm" placeholder="Email address">
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input id="password" name="password" type="password" autocomplete="current-password" required bind:value={password} class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 dark:placeholder-gray-400
                   text-gray-900 dark:text-gray-100 rounded-t-md focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400
                   focus:border-indigo-500 dark:focus:border-indigo-400 focus:z-10 sm:text-sm" placeholder="Password">
          </div>
        </div>
  
        <div>
          <button type="submit" 
          onclick={(event) => btnPressed(event)}
          onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') btnPressed(event)}}
          disabled={waiting}
          class="group relative w-full flex justify-center py-2 px-4
           border border-transparent text-sm font-medium rounded-md text-white
               bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600
               focus:outline-none focus:ring-2 focus:ring-offset-2
               focus:ring-indigo-500 dark:focus:ring-indigo-400">
            Sign in
          </button>
        </div>
      </form>
    </div>
  </div>
