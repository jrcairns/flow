import { SignIn } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="min-h-screen flex bg-muted/30 p-2">
            <div className="w-1/2 ml-auto border rounded-md bg-background p-4 flex items-center">
                <div className="-translate-x-1/2 bg-background rounded-md">
                    <SignIn appearance={{
                        variables: {
                            colorInputBackground: "transparent"
                        }
                    }} />
                </div>
            </div>
        </div>
    )
}