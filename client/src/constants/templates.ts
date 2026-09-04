import type { Language } from '../types';

export const STARTER_TEMPLATES: Record<Language, string> = {
  PYTHON: `# Write your solution here
import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return

    # TODO: Implement your logic here
    pass

if __name__ == '__main__':
    solve()
`,
  CPP: `#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // TODO: Write your solution logic here

    return 0;
}
`,
  JAVA: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        // TODO: Write your solution logic here

    }
}
`,
};
